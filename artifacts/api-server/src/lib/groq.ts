/**
 * Groq client wrapper built on top of the official `groq-sdk` package.
 * Adds env-based initialization, retry, and a couple of convenience helpers
 * (single-turn completion, JSON-mode completion, streaming as an async
 * generator) on top of the raw SDK.
 */
import Groq from "groq-sdk";
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from "groq-sdk/resources/chat/completions";
import { requireEnv, optionalEnv } from "./env.js";
import { ExternalServiceError } from "./errors.js";
import { retry, isRetryableStatus } from "./retry.js";

export type GroqMessage = ChatCompletionMessageParam;
export type GroqTool = ChatCompletionTool;
export type GroqToolChoice = ChatCompletionToolChoiceOption;
export type GroqChatResponse = ChatCompletion;
export type GroqChatChunk = ChatCompletionChunk;

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string | string[];
  tools?: GroqTool[];
  toolChoice?: GroqToolChoice;
  responseFormat?: { type: "text" | "json_object" };
  seed?: number;
  user?: string;
  signal?: AbortSignal;
}

export class GroqApiError extends ExternalServiceError {
  readonly status: number;

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super("groq", message, details);
    this.name = "GroqApiError";
    this.status = status;
  }
}

export interface GroqClientOptions {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

function statusFromGroqError(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function toGroqApiError(error: unknown): GroqApiError {
  if (error instanceof Groq.APIError) {
    return new GroqApiError(error.status ?? 502, error.message, {
      name: error.name,
      code: (error as { code?: string }).code,
    });
  }
  const status = statusFromGroqError(error) ?? 502;
  const message = error instanceof Error ? error.message : String(error);
  return new GroqApiError(status, message);
}

export class GroqClient {
  readonly sdk: Groq;
  private defaultModel: string;

  constructor(options: GroqClientOptions = {}) {
    this.sdk = new Groq({
      apiKey: options.apiKey ?? requireEnv("GROQ_API_KEY"),
      baseURL: options.baseUrl ?? optionalEnv("GROQ_BASE_URL") || undefined,
    });
    this.defaultModel = options.defaultModel ?? optionalEnv("GROQ_DEFAULT_MODEL", "llama-3.3-70b-versatile");
  }

  private buildParams(messages: GroqMessage[], options: GroqChatOptions): Omit<
    ChatCompletionCreateParamsNonStreaming,
    "stream"
  > {
    return {
      model: options.model ?? this.defaultModel,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      stop: options.stop,
      tools: options.tools,
      tool_choice: options.toolChoice,
      response_format: options.responseFormat,
      seed: options.seed,
      user: options.user,
    };
  }

  /**
   * Sends a chat completion request and returns the full response.
   * Retries on 429 / 5xx with exponential backoff.
   */
  async chat(messages: GroqMessage[], options: GroqChatOptions = {}): Promise<GroqChatResponse> {
    return retry(
      async () => {
        try {
          const params: ChatCompletionCreateParamsNonStreaming = {
            ...this.buildParams(messages, options),
            stream: false,
          };
          return await this.sdk.chat.completions.create(params, { signal: options.signal });
        } catch (error) {
          throw toGroqApiError(error);
        }
      },
      {
        attempts: 3,
        baseDelayMs: 500,
        shouldRetry: (error) => error instanceof GroqApiError && isRetryableStatus(error.status),
      }
    );
  }

  /**
   * Sends a chat completion request and streams back content deltas as they
   * arrive. Yields plain text fragments (concatenated `delta.content`).
   */
  async *chatStream(messages: GroqMessage[], options: GroqChatOptions = {}): AsyncGenerator<string, void, unknown> {
    let stream: AsyncIterable<GroqChatChunk>;
    try {
      const params: ChatCompletionCreateParamsStreaming = {
        ...this.buildParams(messages, options),
        stream: true,
      };
      stream = await this.sdk.chat.completions.create(params, { signal: options.signal });
    } catch (error) {
      throw toGroqApiError(error);
    }

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield content;
      }
    } catch (error) {
      throw toGroqApiError(error);
    }
  }

  /**
   * Convenience helper: sends a single-turn prompt (optionally with a system
   * prompt) and returns just the assistant's text reply.
   */
  async complete(prompt: string, options: GroqChatOptions & { systemPrompt?: string } = {}): Promise<string> {
    const messages: GroqMessage[] = [];
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await this.chat(messages, options);
    return response.choices[0]?.message?.content ?? "";
  }

  /**
   * Sends a chat completion request constrained to return valid JSON,
   * and parses the result. Throws GroqApiError if parsing fails.
   */
  async completeJSON<T = unknown>(messages: GroqMessage[], options: GroqChatOptions = {}): Promise<T> {
    const response = await this.chat(messages, {
      ...options,
      responseFormat: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "";
    try {
      return JSON.parse(content) as T;
    } catch {
      throw new GroqApiError(502, "Groq returned invalid JSON", { content });
    }
  }
}

let defaultClient: GroqClient | null = null;

/**
 * Returns a lazily-initialized, process-wide default GroqClient built from
 * the GROQ_API_KEY environment variable.
 */
export function getGroqClient(): GroqClient {
  if (!defaultClient) {
    defaultClient = new GroqClient();
  }
  return defaultClient;
}
