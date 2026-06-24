import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import {
  useGetCollections,
  useCreateCollection,
  getGetCollectionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Collections</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Organize and share your curated paper collections.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl" data-testid="button-new-collection">
            <Plus className="w-4 h-4" />
            New Collection
          </Button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">New Collection</h2>
                <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deep Learning Fundamentals"
                    data-testid="input-collection-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this collection about?"
                    rows={3}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                    data-testid="input-collection-description"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsShared(!isShared)}
                    className={`w-10 h-6 rounded-full transition-colors ${isShared ? "bg-blue-500" : "bg-neutral-300 dark:bg-neutral-700"} relative`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isShared ? "translate-x-5" : "translate-x-1"}`} />
                  </div>
                  <span className="text-sm font-medium">Share with team</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 rounded-xl" disabled={createCollection.isPending} data-testid="button-submit-collection">
                    {createCollection.isPending ? "Creating..." : "Create Collection"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <div
                key={col.id}
                className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group cursor-pointer"
                data-testid={`card-collection-${col.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  {col.isShared ? (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                      <Users className="w-3 h-3" /> Shared
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-neutral-100 text-neutral-500 dark:bg-neutral-800 rounded-full font-medium border border-neutral-200 dark:border-neutral-700">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {col.name}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">{col.description}</p>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{col.paperCount} papers</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
            <FolderOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">No collections yet</h3>
            <p className="text-neutral-500 text-sm mb-6">Create your first collection to organize saved papers.</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-xl">
              Create Collection
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
