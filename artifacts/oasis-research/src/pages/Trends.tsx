import React from "react";
import MainLayout from "../components/MainLayout";
import { useGetTrendsOverview } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ArrowUpRight } from "lucide-react";

export default function TrendsPage() {
  const { data: trends, isLoading } = useGetTrendsOverview({ field: "" });

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold mb-2">Novelty & Trend Analysis</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Track the velocity of research fields and emerging topics.</p>
        </div>

        {isLoading && (
          <div className="space-y-8">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </div>
        )}

        {trends && (
          <div className="space-y-8">
            {/* Chart Area */}
            <div className="p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                  Publication Volume Trends
                </h2>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.timeseriesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="year" stroke="#666" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rising Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 px-2">Rising Topics</h3>
                <div className="space-y-3">
                  {trends.risingTopics.map((topic, i) => (
                    <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white mb-1">{topic.name}</p>
                        <p className="text-xs text-neutral-500">{topic.field} • {topic.paperCount} papers</p>
                      </div>
                      <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-lg">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        <span className="font-bold text-sm">+{topic.growth}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 px-2">Trending Fields</h3>
                <div className="space-y-3">
                  {trends.trendingFields.map((field, i) => (
                    <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white mb-1">{field.name}</p>
                        <p className="text-xs text-neutral-500">{field.paperCount} papers</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                          Score: {Math.round(field.noveltyScore * 100)}
                        </div>
                        {field.growthRate && (
                          <div className="text-xs text-neutral-500">
                            Growth: {field.growthRate}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}