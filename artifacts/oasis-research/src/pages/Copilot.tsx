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
            { role: "assistant", content: data.answer, citations: data.citations },
          ]);
          if (data.sessionId) setCurrentSessionId(data.sessionId);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
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
      <div className="flex h-full bg-[#050505]">
        {/* Sessions sidebar */}
        <div className="hidden md:flex w-56 border-r border-white/5 bg-[#080808] flex-col flex-shrink-0">
          <div className="p-3 border-b border-white/5">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-neutral-200 hover:border-white/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sessionsLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg bg-white/5" />)}
              </div>
            ) : (
              sessions?.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                    currentSessionId === session.id
                      ? "bg-white/8 border border-white/10 text-neutral-200"
                      : "text-neutral-600 hover:bg-white/5 hover:text-neutral-400"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-neutral-600" />
                  <span className="truncate">{session.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10"
                  style={{
                    background: "radial-gradient(ellipse, #818cf8 0%, #c084fc 50%, transparent 70%)",
                    filter: "blur(80px)",
                  }}
                />
              </div>

              <div className="relative z-10 text-center max-w-xl w-full">
                <div className="mb-2 text-xs font-bold text-neutral-600 tracking-widest uppercase">AI Copilot</div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight tracking-tight">
                  AI for Researchers
                </h1>
                <p className="text-neutral-500 mb-8 text-base">Backed by scientific literature.</p>

                {/* Main input */}
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-3">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`"What are the latest treatments for MASLD?"`}
                    rows={3}
                    className="w-full px-5 pt-5 pb-3 bg-transparent text-neutral-200 placeholder:text-neutral-600 text-sm resize-none outline-none leading-relaxed"
                  />
                  <div className="flex items-center gap-3 px-4 pb-3 pt-1 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${tableMode ? "border-violet-500 bg-violet-500" : "border-white/20"}`}
                        onClick={() => setTableMode(!tableMode)}
                      >
                        {tableMode && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-xs text-neutral-600 font-medium flex items-center gap-1">
                        <TableProperties className="w-3 h-3" /> Table Mode
                      </span>
                    </label>
                    <button
                      onClick={() => handleAsk()}
                      disabled={!question.trim() || askMutation.isPending}
                      className="ml-auto bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed text-black rounded-xl p-2 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-neutral-600 mb-8">
                  <BookOpen className="w-3.5 h-3.5" />
                  Answers backed by
                  <span className="font-semibold text-neutral-400">280M+</span>
                  scientific articles
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAsk(q)}
                      className="text-left px-4 py-3 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/16 rounded-xl text-xs text-neutral-500 hover:text-neutral-300 transition-all flex items-center gap-2"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                      <span>"{q}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-white/8 border border-white/10 rounded-2xl px-5 py-3.5 max-w-[80%] text-sm text-neutral-200 leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white/3 border border-white/8 rounded-2xl px-6 py-5">
                          <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-white/8">
                              <div className="flex items-center gap-2 mb-3">
                                <Quote className="w-3.5 h-3.5 text-neutral-600" />
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">
                                  {msg.citations.length} References
                                </span>
                              </div>
                              <div className="space-y-2">
                                {msg.citations.map((cite, ci) => (
                                  <div
                                    key={cite.id}
                                    className="flex gap-2 text-xs text-neutral-500 p-2.5 bg-white/3 rounded-xl border border-white/6"
                                  >
                                    <span className="text-neutral-600 font-mono font-semibold w-5 flex-shrink-0">
                                      [{ci + 1}]
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-medium text-neutral-300 leading-snug mb-0.5">{cite.title}</p>
                                      <p className="text-neutral-600">
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
                    <div className="bg-white/3 border border-white/8 rounded-2xl px-6 py-5">
                      <div className="flex items-center gap-3 text-neutral-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching scientific literature...
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-3.5 w-full bg-white/5" />
                        <Skeleton className="h-3.5 w-[90%] bg-white/5" />
                        <Skeleton className="h-3.5 w-[75%] bg-white/5" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {!isEmpty && (
            <div className="border-t border-white/5 bg-[#080808] p-4">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question... (Enter to send)"
                    rows={2}
                    className="w-full px-5 pt-4 pb-2 bg-transparent text-neutral-200 placeholder:text-neutral-600 text-sm resize-none outline-none leading-relaxed"
                  />
                  <div className="flex items-center gap-3 px-4 pb-3 pt-1 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${tableMode ? "border-violet-500 bg-violet-500" : "border-white/20"}`}
                        onClick={() => setTableMode(!tableMode)}
                      >
                        {tableMode && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className="text-xs text-neutral-600 flex items-center gap-1">
                        <TableProperties className="w-3 h-3" /> Table Mode
                      </span>
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-neutral-700">↵ Enter to send</span>
                      <button
                        onClick={() => handleAsk()}
                        disabled={!question.trim() || askMutation.isPending}
                        className="bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed text-black rounded-xl p-2 transition-colors"
                      >
                        {askMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
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
