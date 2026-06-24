import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useDiscoverGaps } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Target, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GapsPage() {
  const [field, setField] = useState("");
  const gapsMutation = useDiscoverGaps();

  const handleDiscover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!field.trim()) return;
    gapsMutation.mutate({ data: { field } });
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Gap Discovery</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Uncover underexplored areas and high-impact opportunities in your field.</p>
          </div>
        </div>

        <form onSubmit={handleDiscover} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl mb-10 flex gap-4 items-center shadow-sm">
          <div className="flex-1 relative">
            <Lightbulb className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
            <Input 
              value={field}
              onChange={e => setField(e.target.value)}
              placeholder="Target field (e.g. Reinforcement Learning, Materials Science)..."
              className="w-full pl-12 py-6 text-lg border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
            />
          </div>
          <Button type="submit" size="lg" className="rounded-xl px-8 h-auto bg-amber-500 hover:bg-amber-600 text-white" disabled={gapsMutation.isPending}>
            Discover Gaps
          </Button>
        </form>

        {gapsMutation.isPending && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
                <Skeleton className="h-8 w-1/4 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gapsMutation.data && (
          <div className="space-y-8">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-6 rounded-2xl">
              <h3 className="text-amber-800 dark:text-amber-500 font-medium mb-2 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Analysis Summary: {gapsMutation.data.field}
              </h3>
              <p className="text-amber-900/80 dark:text-amber-200/80 text-sm leading-relaxed">
                {gapsMutation.data.summary || "Identified several high-potential gaps with low competition."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gapsMutation.data.gaps.map(gap => (
                <div key={gap.id} className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-amber-300 dark:hover:border-amber-700/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-8xl font-black">{gap.impactScore}</span>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex gap-2 mb-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                        gap.competitionLevel === 'Low' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        gap.competitionLevel === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      }`}>
                        Comp: {gap.competitionLevel}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                        gap.difficultyLevel === 'Low' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        gap.difficultyLevel === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      }`}>
                        Diff: {gap.difficultyLevel}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                      {gap.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                      {gap.description}
                    </p>
                    
                    {gap.opportunity && (
                      <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-1">Opportunity</p>
                        <p className="text-xs text-neutral-500">{gap.opportunity}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}