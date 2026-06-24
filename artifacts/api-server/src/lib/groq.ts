import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function chatCompletion(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
  });
  return completion.choices[0]?.message?.content ?? "";
}
