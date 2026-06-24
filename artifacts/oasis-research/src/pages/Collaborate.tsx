import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import {
  useGetProjects,
  useCreateProject,
  useGetTeamMembers,
  useGetRecentActivity,
  useGetCollections,
  getGetProjectsQueryKey,
  getGetCollectionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, FolderOpen, BookOpen, Activity, Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollaboratePage() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading: projectsLoading } = useGetProjects();
  const { data: team, isLoading: teamLoading } = useGetTeamMembers();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: collections, isLoading: collectionsLoading } = useGetCollections();
  const createProject = useCreateProject();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject.mutate(
      { data: { name, description } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
          setName("");
          setDescription("");
          setShowForm(false);
        },
      }
    );
  };

  const activityTypeColors: Record<string, string> = {
    paper_saved: "bg-blue-500",
    collection_created: "bg-purple-500",
    project_created: "bg-green-500",
    gap_discovered: "bg-amber-500",
    search_performed: "bg-neutral-400",
    comment_added: "bg-pink-500",
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Collaborate</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Share collections, annotate papers, and collaborate with your team.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl"
            data-testid="button-create-project"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">New Research Project</h2>
                <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Neuro-symbolic AI for Drug Discovery"
                    data-testid="input-project-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the project goals and scope..."
                    rows={3}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                    data-testid="input-project-description"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 rounded-xl" disabled={createProject.isPending} data-testid="button-submit-project">
                    {createProject.isPending ? "Creating..." : "Create Project"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Projects + Collections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Projects */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-500" />
                Projects
                {projects && <span className="ml-auto text-sm font-normal text-neutral-500">{projects.length} projects</span>}
              </h2>
              {projectsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all"
                      data-testid={`card-project-${project.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{project.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            project.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {project.memberCount} members
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {project.paperCount} papers
                        </span>
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex gap-1 ml-auto">
                            {project.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-500">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
                  <FolderOpen className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 mb-4">No projects yet</p>
                  <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-xl">
                    Create your first project
                  </Button>
                </div>
              )}
            </section>

            {/* Collections */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Shared Collections
                {collections && (
                  <span className="ml-auto text-sm font-normal text-neutral-500">
                    {collections.filter((c) => c.isShared).length} shared
                  </span>
                )}
              </h2>
              {collectionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
              ) : collections && collections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-purple-300 dark:hover:border-purple-700/50 transition-all"
                      data-testid={`card-collection-${col.id}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-sm text-neutral-900 dark:text-white">{col.name}</h3>
                        {col.isShared && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full font-medium">
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mb-2 line-clamp-1">{col.description}</p>
                      <p className="text-xs text-neutral-400">{col.paperCount} papers</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm py-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  No collections yet. Save papers to create collections.
                </p>
              )}
            </section>
          </div>

          {/* Right column: Team + Activity */}
          <div className="space-y-8">
            {/* Team Members */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Team
                {team && <span className="ml-auto text-sm font-normal text-neutral-500">{team.length} members</span>}
              </h2>
              {teamLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {team?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      data-testid={`card-member-${member.id}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{member.name}</p>
                        <p className="text-xs text-neutral-400 truncate">{member.institution ?? member.email}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          member.role === "admin"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Recent Activity
              </h2>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {activity?.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors" data-testid={`item-activity-${item.id}`}>
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activityTypeColors[item.type] ?? "bg-neutral-400"}`} />
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.description}</p>
                        <p className="text-xs text-neutral-400 mt-1">{item.user} · {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
