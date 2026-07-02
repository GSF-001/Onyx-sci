import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import {
  useGetCollections,
  useCreateCollection,
  getGetCollectionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Plus, X, Users, BookOpen, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsPage() {
  const queryClient = useQueryClient();
  const { data: collections, isLoading } = useGetCollections();
  const createCollection = useCreateCollection();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCollection.mutate(
      { data: { name, description, isShared } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCollectionsQueryKey() });
          setName("");
          setDescription("");
          setIsShared(false);
          setShowForm(false);
        },
      }
    );
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Collections</h1>
            <p className="text-neutral-500 text-sm">Organize and share your curated paper collections.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-neutral-100 transition-colors"
            data-testid="button-new-collection"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0f] rounded-2xl border border-white/10 p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">New Collection</h2>
                <button onClick={() => setShowForm(false)} className="text-neutral-600 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deep Learning Fundamentals"
                    className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-white/20 transition-colors"
                    data-testid="input-collection-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this collection about?"
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 resize-none outline-none focus:border-white/20 transition-colors"
                    data-testid="input-collection-description"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsShared(!isShared)}
                    className={`w-10 h-6 rounded-full transition-colors ${isShared ? "bg-sky-500" : "bg-white/10"} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isShared ? "translate-x-5" : "translate-x-1"}`} />
                  </div>
                  <span className="text-sm font-medium text-neutral-400">Share with team</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                    disabled={createCollection.isPending}
                    data-testid="button-submit-collection"
                  >
                    {createCollection.isPending ? "Creating..." : "Create Collection"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-3 border border-white/10 text-neutral-400 font-medium text-sm rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/4" />
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <div
                key={col.id}
                className="p-6 rounded-2xl border border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/3 transition-all group cursor-pointer"
                data-testid={`card-collection-${col.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  {col.isShared ? (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-sky-500/10 text-sky-400 rounded-full font-medium border border-sky-500/20">
                      <Users className="w-3 h-3" /> Shared
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white/5 text-neutral-500 rounded-full font-medium border border-white/8">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-neutral-200 mb-1 group-hover:text-violet-400 transition-colors">
                  {col.name}
                </h3>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{col.description}</p>
                <div className="flex items-center gap-1 text-xs text-neutral-600 font-mono">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{col.paperCount} papers</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/8 rounded-2xl">
            <FolderOpen className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-400 mb-2">No collections yet</h3>
            <p className="text-neutral-600 text-sm mb-6">Create your first collection to organize saved papers.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 border border-white/10 text-neutral-400 font-medium text-sm rounded-xl hover:bg-white/5 hover:text-neutral-200 transition-colors"
            >
              Create Collection
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
