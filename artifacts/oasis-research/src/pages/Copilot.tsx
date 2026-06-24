import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useAskCopilot, useGetCopilotSessions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, MessageSquare, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CopilotPage() {
  const [question, setQuestion] = useState("");
  const askMutation = useAskCopilot();
  const { data: sessions, isLoading: sessionsLoading } = useGetCopilotSessions();

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate({ data: { question } });
  };

  return (
    <MainLayout>
      <div className="flex h-full">
        {/* Sessions Sidebar */}
        <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <Button className="w-full justify-start rounded-lg" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> New Session
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessionsLoading && (
              <div className="p-2 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
            {sessions?.map(session => (
              <div key={session.id} className="px-3 py-2 text-sm rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer flex items-center text-neutral-700 dark:text-neutral-300">
                <MessageSquare className="w-4 h-4 mr-3 text-neutral-400" />
                <span className="truncate">{session.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Intro state if no active query */}
              {!askMutation.data && !askMutation.isPending && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">AI Research Copilot</h2>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                    Ask questions, synthesize literature, and uncover insights across millions of academic papers.
                  </p>
                </div>
              )}

              {/* Fake History (Just showing the last interaction for simplicity in this demo) */}
              {askMutation.isPending && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-6 py-4 max-w-[80%]">
                      <p className="text-neutral-900 dark:text-neutral-100">{question}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 py-4 max-w-[80%] space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[60%]" />
                    </div>
                  </div>
                </div>
              )}

              {askMutation.data && !askMutation.isPending && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-6 py-4 max-w-[80%]">
                      <p className="text-neutral-900 dark:text-neutral-100">{question}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 py-4 max-w-[80%] shadow-sm">
                      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                        {askMutation.data.answer}
                      </div>
                      
                      {askMutation.data.citations && askMutation.data.citations.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">References</h4>
                          <div className="space-y-2">
                            {askMutation.data.citations.map((cite, i) => (
                              <div key={cite.id} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start">
                                <span className="font-medium w-4 shrink-0">[{i + 1}]</span>
                                <span>{cite.title}. <span className="text-neutral-400">{cite.authors[0]} et al., {cite.year}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleAsk} className="relative flex items-center">
                <Input 
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask a research question..."
                  className="w-full pl-6 pr-14 py-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-base"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={askMutation.isPending || !question.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}