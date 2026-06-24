import React from "react";
import { Link, useLocation } from "wouter";
import { Search, Sparkles, Network, Lightbulb, TrendingUp, Users, Library, FolderHeart, Home } from "lucide-react";
import OasisLogo from "./OasisLogo";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/search", label: "Semantic Search", icon: Search },
    { href: "/copilot", label: "AI Copilot", icon: Sparkles },
    { href: "/graph", label: "Knowledge Graph", icon: Network },
    { href: "/gaps", label: "Gap Discovery", icon: Lightbulb },
    { href: "/trends", label: "Novelty Trends", icon: TrendingUp },
    { href: "/collaborate", label: "Collaborate", icon: Users },
  ];

  const libItems = [
    { href: "/papers", label: "Saved Papers", icon: Library },
    { href: "/collections", label: "Collections", icon: FolderHeart },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 border-r border-neutral-100 bg-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-neutral-100">
          <Link href="/home" className="flex items-center gap-2.5 cursor-pointer">
            <OasisLogo size={26} color="#111" />
            <div className="leading-none">
              <div className="font-bold tracking-[0.18em] text-[11px] text-neutral-900">OASIS</div>
              <div className="text-[8px] tracking-[0.22em] text-neutral-400 font-medium">RESEARCH</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-5 px-3">
          {/* Home link */}
          <Link href="/home">
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
              location === "/home"
                ? "bg-neutral-100 text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
            }`}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </div>
          </Link>

          <div>
            <p className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-2 px-3">Modules</p>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isActive
                        ? "bg-neutral-100 text-neutral-900 font-medium"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-2 px-3">Library</p>
            <nav className="space-y-0.5">
              {libItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isActive
                        ? "bg-neutral-100 text-neutral-900 font-medium"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-100">
          <Link href="/">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">
              <span className="text-[10px] font-medium">← Back to Landing</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
