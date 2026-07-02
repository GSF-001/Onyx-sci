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
    paper_saved: "bg-sky-500",
    collection_created: "bg-violet-500",
    project_created: "bg-emerald-500",
    gap_discovered: "bg-amber-500",
    search_performed: "bg-neutral-500",
    comment_added: "bg-pink-500",
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Collaborate</h1>
            <p className="text-neutral-500 text-sm">
              Share collections, annotate papers, and collaborate with your team.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-bold text-sm rounded-xl hover:bg-neutral-100 transition-colors"
            data-testid="button-create-project"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0f] rounded-2xl border border-white/10 p-8 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">New Research Project</h2>
                <button onClick={() => setShowForm(false)} className="text-neutral-600 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Project Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Neuro-symbolic AI for Drug Discovery"
                    className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-white/20 transition-colors"
                    data-testid="input-project-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the project goals and scope..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 resize-none outline-none focus:border-white/20 transition-colors"
                    data-testid="input-project-description"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                    disabled={createProject.isPending}
                    data-testid="button-submit-project"
                  >
                    {createProject.isPending ? "Creating..." : "Create Project"}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Projects */}
            <section>
              <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                <FolderOpen className="w-4 h-4 text-sky-400" />
                Projects
                {projects && <span className="ml-auto text-xs font-normal text-neutral-600 normal-case tracking-normal">{projects.length} projects</span>}
              </h2>
              {projectsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/4" />)}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-5 rounded-2xl border border-white/6 bg-white/2 hover:border-sky-500/20 hover:bg-white/3 transition-all"
                      data-testid={`card-project-${project.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-neutral-200">{project.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          project.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-white/5 text-neutral-500 border border-white/8"
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-neutral-600">
                        <span className="flex items-center gap-1 font-mono">
                          <Users className="w-3 h-3" /> {project.memberCount} members
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <BookOpen className="w-3 h-3" /> {project.paperCount} papers
                        </span>
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex gap-1 ml-auto">
                            {project.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-white/4 border border-white/8 rounded-full text-neutral-600">
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
                <div className="text-center py-12 border border-dashed border-white/8 rounded-2xl">
                  <FolderOpen className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-500 mb-4 text-sm">No projects yet</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 border border-white/10 text-neutral-400 text-sm font-medium rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Create your first project
                  </button>
                </div>
              )}
            </section>

            {/* Collections */}
            <section>
              <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                <BookOpen className="w-4 h-4 text-violet-400" />
                Shared Collections
                {collections && (
                  <span className="ml-auto text-xs font-normal text-neutral-600 normal-case tracking-normal">
                    {collections.filter((c) => c.isShared).length} shared
                  </span>
                )}
              </h2>
              {collectionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/4" />)}
                </div>
              ) : collections && collections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="p-4 rounded-2xl border border-white/6 bg-white/2 hover:border-violet-500/20 hover:bg-white/3 transition-all"
                      data-testid={`card-collection-${col.id}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-sm text-neutral-300">{col.name}</h3>
                        {col.isShared && (
                          <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full font-medium border border-violet-500/20">
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mb-2 line-clamp-1">{col.description}</p>
                      <p className="text-xs text-neutral-700 font-mono">{col.paperCount} papers</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-sm py-6 text-center border border-dashed border-white/8 rounded-2xl">
                  No collections yet. Save papers to create collections.
                </p>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* Team Members */}
            <section>
              <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Users className="w-4 h-4 text-emerald-400" />
                Team
                {team && <span className="ml-auto text-xs font-normal text-neutral-600 normal-case tracking-normal">{team.length} members</span>}
              </h2>
              {teamLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/4" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {team?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors"
                      data-testid={`card-member-${member.id}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-300 truncate">{member.name}</p>
                        <p className="text-xs text-neutral-600 truncate">{member.institution ?? member.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        member.role === "admin"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "bg-white/5 text-neutral-500 border border-white/8"
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Activity className="w-4 h-4 text-amber-400" />
                Recent Activity
              </h2>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/4" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {activity?.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors" data-testid={`item-activity-${item.id}`}>
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activityTypeColors[item.type] ?? "bg-neutral-500"}`} />
                      <div>
                        <p className="text-xs text-neutral-500 leading-relaxed">{item.description}</p>
                        <p className="text-xs text-neutral-700 mt-1">{item.user} · {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
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
