import { Router } from "express";
import { db } from "@workspace/db";
import { copilotSessionsTable, copilotMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { chatCompletion } from "../lib/groq";
import { generateId } from "../lib/id";

const router = Router();

type Citation = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  url?: string;
};

// ---------- Helpers ----------

function serializeSession(s: typeof copilotSessionsTable.$inferSelect) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt ? s.updatedAt.toISOString() : null,
  };
}

function serializeMessage(m: typeof copilotMessagesTable.$inferSelect) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
    citations: (m.citations as Citation[]) ?? [],
  };
}

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>
) {
  return async (req: import("express").Request, res: import("express").Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      req.log.error({ err }, `${req.method} ${req.originalUrl} failed`);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

async function sessionExists(sessionId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: copilotSessionsTable.id })
    .from(copilotSessionsTable)
    .where(eq(copilotSessionsTable.id, sessionId))
    .limit(1);
  return !!row;
}

async function appendExchange(
  sessionId: string,
  question: string,
  answer: string,
  citations: Citation[]
) {
  const userMsgId = generateId();
  const aiMsgId = generateId();
  await db.insert(copilotMessagesTable).values([
    { id: userMsgId, sessionId, role: "user", content: question, citations: [] },
    { id: aiMsgId, sessionId, role: "assistant", content: answer, citations },
  ]);

  const messageCount = await db.$count(
    copilotMessagesTable,
    eq(copilotMessagesTable.sessionId, sessionId)
  );

  await db
    .update(copilotSessionsTable)
    .set({
      messageCount,
      lastMessage: question.slice(0, 100),
      updatedAt: new Date(),
    })
    .where(eq(copilotSessionsTable.id, sessionId));
}

// Retry a flaky LLM call once before giving up, so a single transient
// network/rate-limit hiccup doesn't fail the whole request
async function chatCompletionWithRetry(
  messages: Parameters<typeof chatCompletion>[0],
  options: Parameters<typeof chatCompletion>[1]
): Promise<string> {
  try {
    return await chatCompletion(messages, options);
  } catch (err) {
    return await chatCompletion(messages, options);
  }
}

// ---------- Ask ----------

router.post(
  "/ask",
  asyncHandler(async (req, res) => {
    const { question, sessionId, context } = req.body as {
      question?: string;
      sessionId?: string;
      context?: string;
    };

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "question is required" });
    }
    if (sessionId) {
      const exists = await sessionExists(sessionId);
      if (!exists) return res.status(404).json({ error: "Session not found" });
    }

    const systemPrompt = `You are OASIS Research AI Copilot — an expert scientific research assistant with access to 100M+ academic papers. You provide accurate, well-cited answers to research questions.

When answering:
1. Give a comprehensive, scientifically accurate answer
2. Reference specific papers with [1], [2], [3] citation markers inline
3. At the end, list citations in this exact JSON format within a <citations> block
4. Suggest 3 follow-up questions

Format your response as:
ANSWER: <your detailed answer with [1][2] citation markers>

<citations>
[
  {"id": "paper_1", "title": "Paper Title", "authors": ["Author A", "Author B"], "year": 2023, "journal": "Nature", "url": "https://doi.org/xxx"},
  ...
]
</citations>

FOLLOW_UPS:
- Question 1?
- Question 2?
- Question 3?`;

    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "user" as const, content: `Context: ${context}` }] : []),
      { role: "user", content: question },
    ];

    const response = await chatCompletionWithRetry(messages, { temperature: 0.4, maxTokens: 2500 });

    const answerMatch = response.match(/ANSWER:([\s\S]*?)(?=<citations>|FOLLOW_UPS:|$)/i);
    const citationsMatch = response.match(/<citations>([\s\S]*?)<\/citations>/i);
    const followUpsMatch = response.match(/FOLLOW_UPS:([\s\S]*?)$/i);

    let citations: Citation[] = [];
    if (citationsMatch) {
      try {
        const parsed = JSON.parse(citationsMatch[1].trim());
        if (Array.isArray(parsed)) citations = parsed;
      } catch (_) {
        citations = [];
      }
    }

    const followUps = followUpsMatch
      ? followUpsMatch[1]
          .trim()
          .split("\n")
          .filter((l: string) => l.trim().startsWith("-"))
          .map((l: string) => l.replace(/^-\s*/, "").trim())
          .filter(Boolean)
      : [];

    const answer = answerMatch ? answerMatch[1].trim() : response;

    let activeSessionId = sessionId;
    if (activeSessionId) {
      await appendExchange(activeSessionId, question, answer, citations);
    } else {
      activeSessionId = generateId();
      await db.insert(copilotSessionsTable).values({
        id: activeSessionId,
        title: question.slice(0, 80),
        messageCount: 0,
        lastMessage: "",
      });
      await appendExchange(activeSessionId, question, answer, citations);
    }

    res.json({
      answer,
      citations,
      sessionId: activeSessionId,
      followUpQuestions: followUps,
      papersUsed: citations.length,
    });
  })
);

// ---------- Summarize ----------

router.post(
  "/summarize",
  asyncHandler(async (req, res) => {
    const { text, paperId, mode = "brief" } = req.body as {
      text?: string;
      paperId?: string;
      mode?: string;
    };

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const modeInstructions: Record<string, string> = {
      brief: "Provide a brief 2-3 sentence summary",
      detailed: "Provide a detailed summary covering all major sections",
      technical: "Provide a technical summary focused on methods and results",
      layperson: "Explain this paper in simple terms a non-expert can understand",
    };
    const resolvedMode = modeInstructions[mode] ? mode : "brief";

    const prompt = `${modeInstructions[resolvedMode]} of this research paper text.

Paper text: "${text.slice(0, 3000)}"

Respond in this JSON format:
{
  "summary": "Main summary paragraph",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "limitations": ["Limitation 1", "Limitation 2"],
  "futureDirections": ["Direction 1", "Direction 2"],
  "readingTime": 5
}

Return ONLY valid JSON.`;

    const response = await chatCompletionWithRetry([{ role: "user", content: prompt }], {
      temperature: 0.3,
    });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "AI response could not be parsed" });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({ ...parsed, paperId: paperId ?? null, mode: resolvedMode });
    } catch (_) {
      res.status(502).json({ error: "AI response could not be parsed" });
    }
  })
);

// ---------- Sessions ----------

// Get sessions (most recently updated first)
router.get(
  "/sessions",
  asyncHandler(async (_req, res) => {
    const sessions = await db
      .select()
      .from(copilotSessionsTable)
      .orderBy(copilotSessionsTable.updatedAt);
    res.json(sessions.reverse().map(serializeSession));
  })
);

// Create session
router.post(
  "/sessions",
  asyncHandler(async (req, res) => {
    const { title } = req.body as { title?: string };
    const id = generateId();
    const [session] = await db
      .insert(copilotSessionsTable)
      .values({ id, title: title?.trim() || "Untitled session", messageCount: 0 })
      .returning();
    res.status(201).json(serializeSession(session));
  })
);

// Rename a session
router.patch(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    const { title } = req.body as { title?: string };
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    const [session] = await db
      .update(copilotSessionsTable)
      .set({ title: title.trim(), updatedAt: new Date() })
      .where(eq(copilotSessionsTable.id, req.params.id))
      .returning();

    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(serializeSession(session));
  })
);

// Delete a session (and its messages)
router.delete(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    await db.delete(copilotMessagesTable).where(eq(copilotMessagesTable.sessionId, req.params.id));
    const deleted = await db
      .delete(copilotSessionsTable)
      .where(eq(copilotSessionsTable.id, req.params.id))
      .returning({ id: copilotSessionsTable.id });

    if (deleted.length === 0) return res.status(404).json({ error: "Session not found" });
    res.status(204).send();
  })
);

// Get messages for a session
router.get(
  "/sessions/:id/messages",
  asyncHandler(async (req, res) => {
    const exists = await sessionExists(req.params.id);
    if (!exists) return res.status(404).json({ error: "Session not found" });

    const messages = await db
      .select()
      .from(copilotMessagesTable)
      .where(eq(copilotMessagesTable.sessionId, req.params.id))
      .orderBy(copilotMessagesTable.createdAt);

    res.json(messages.map(serializeMessage));
  })
);

export default router;
