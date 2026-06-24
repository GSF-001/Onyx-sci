import React, { useState, useRef, useEffect } from "react";
import MainLayout from "../components/MainLayout";
import { useAskCopilot, useGetCopilotSessions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Plus,
  Settings,
  TableProperties,
  BookOpen,
  Quote,
  ChevronRight,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ id: string; title: string; authors: string[]; year: number; journal?: string }>;
}

const EXAMPLE_QUESTIONS = [
  "What are the latest treatments for MASLD?",
  "How does CRISPR-Cas9 compare to base editing?",
  "Summarize the evidence on intermittent fasting and longevity",
  "What methods exist for single-cell RNA sequencing?",
];

export default function CopilotPage() {
  const [question, setQuestion] = useState("");
  const [tableMode, setTableMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const askMutation = useAskCopilot();
  const { data: sessions, isLoading: sessionsLoading } = useGetCopilotSessions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, askMutation.isPending]);

  const handleAsk = (q?: string) => {
    const text = (q ?? question).trim();
    if (!text || askMutation.isPending) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");

    askMutation.mutate(
      { data: { question: text, sessionId: currentSessionId } },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.answer,
              citations: data.citations,
            },
          ]);
          if (data.sessionId) setCurrentSessionId(data.sessionId);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Sorry, I encountered an error. Please try again.",
            },
          ]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(undefined);
    setQuestion("");
  };

  const isEmpty = messages.length === 0 && !askMutation.isPending;

  return (
    <MainLayout>
      <div className="flex h-full bg-white">
        {/* Sessions sidebar */}
        <div className="w-60 border-r border-neutral-100 bg-neutral-50 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-neutral-100">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-white hover:border-neutral-300 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sessionsLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : (
              sessions?.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                    currentSessionId === session.id
                      ? "bg-white border border-neutral-200 text-neutral-900 shadow-sm"
                      : "text-neutral-600 hover:bg-white hover:text-neutral-900"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
                  <span className="truncate">{session.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {isEmpty ? (
            /* Hero / empty state — scite.ai style */
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
              {/* Gradient background blob */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
                  style={{
                    background: "radial-gradient(ellipse, #c7b4f0 0%, #f0c4d4 40%, transparent 70%)",
                    filter: "blur(60px)",
                  }}
                />
              </div>

              <div className="relative z-10 text-center max-w-xl w-full">
                <div className="mb-2 text-xs font-medium text-neutral-400 tracking-wider uppercase">AI Copilot</div>
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2 leading-tight">
                  AI for Researchers
                </h1>
                <p className="text-neutral-500 mb-8 text-base">Backed by scientific literature.</p>

                {/* Main input */}
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mb-3">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`"What are the latest treatments for MASLD?"`}
                    rows={3}
                    className="w-full px-5 pt-5 pb-3 text-neutral-900 placeholder:text-neutral-400 text-sm resize-none outline-none leading-relaxed"
                  />
                  <div className="flex items-center gap-3 px-4 pb-3 pt-1 border-t border-neutral-100">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${tableMode ? "border-blue-500 bg-blue-500" : "border-neutral-300"}`}
                        onClick={() => setTableMode(!tableMode)}
                      >
                        {tableMode && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                        <TableProperties className="w-3 h-3" /> Table Mode
                      </span>
                    </label>
                    <button className="ml-auto text-neutral-400 hover:text-neutral-600 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAsk()}
                      disabled={!question.trim() || askMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Citation badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 mb-8">
                  <BookOpen className="w-3.5 h-3.5" />
                  Answers backed by
                  <span className="font-semibold text-neutral-600">280M+</span>
                  scientific articles
                </div>

                {/* Example questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAsk(q)}
                      className="text-left px-4 py-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                      <span>"{q}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Conversation view */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-neutral-100 rounded-2xl px-5 py-3.5 max-w-[80%] text-sm text-neutral-900 leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Answer */}
                        <div className="bg-white border border-neutral-200 rounded-2xl px-6 py-5 shadow-sm">
                          <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-neutral-100">
                              <div className="flex items-center gap-2 mb-3">
                                <Quote className="w-3.5 h-3.5 text-neutral-400" />
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                  {msg.citations.length} References
                                </span>
                              </div>
                              <div className="space-y-2">
                                {msg.citations.map((cite, ci) => (
                                  <div
                                    key={cite.id}
                                    className="flex gap-2 text-xs text-neutral-600 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100"
                                  >
                                    <span className="text-neutral-400 font-mono font-semibold w-5 flex-shrink-0">
                                      [{ci + 1}]
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-medium text-neutral-800 leading-snug mb-0.5">{cite.title}</p>
                                      <p className="text-neutral-400">
                                        {cite.authors.slice(0, 2).join(", ")}
                                        {cite.authors.length > 2 ? " et al." : ""} · {cite.year}
                                        {cite.journal ? ` · ${cite.journal}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {askMutation.isPending && (
                  <div>
                    <div className="bg-white border border-neutral-200 rounded-2xl px-6 py-5 shadow-sm">
                      <div className="flex items-center gap-3 text-neutral-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching scientific literature...
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3.5 w-[90%]" />
                        <Skeleton className="h-3.5 w-[75%]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {/* Bottom input (only when there are messages) */}
          {!isEmpty && (
            <div className="border-t border-neutral-100 bg-white p-4">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question... (Enter to send)"
                    rows={2}
                    className="w-full px-5 pt-4 pb-2 text-neutral-900 placeholder:text-neutral-400 text-sm resize-none outline-none leading-relaxed"
                  />
                  <div className="flex items-center gap-3 px-4 pb-3 pt-1 border-t border-neutral-100">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${tableMode ? "border-blue-500 bg-blue-500" : "border-neutral-300"}`}
                        onClick={() => setTableMode(!tableMode)}
                      >
                        {tableMode && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <TableProperties className="w-3 h-3" /> Table Mode
                      </span>
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-neutral-400">↵ Enter to send</span>
                      <button
                        onClick={() => handleAsk()}
                        disabled={!question.trim() || askMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2 transition-colors"
                      >
                        {askMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
