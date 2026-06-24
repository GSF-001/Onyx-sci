import React from "react";
import { Link, useLocation } from "wouter";
import { Search, Sparkles, Network, Lightbulb, TrendingUp, Users, Library, FolderHeart, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

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
    <div className="flex h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white font-sans overflow-hidden">
      <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/" className="flex items-center space-x-3 cursor-pointer">
            <div className="w-6 h-6 border-2 border-neutral-800 dark:border-neutral-200 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            </div>
            <span className="font-bold tracking-widest text-sm">OASIS RESEARCH</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6 px-4">
          <div>
            <p className="text-xs font-semibold text-neutral-500 tracking-wider uppercase mb-3 px-2">Modules</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50"}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-500 tracking-wider uppercase mb-3 px-2">Library</p>
            <nav className="space-y-1">
              {libItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50"}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="ghost" className="w-full justify-start text-neutral-600 dark:text-neutral-400" onClick={toggleTheme}>
            <Sun className="w-4 h-4 mr-2 hidden dark:block" />
            <Moon className="w-4 h-4 mr-2 block dark:hidden" />
            <span className="text-sm">Toggle Theme</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-neutral-50 dark:bg-[#050505]">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}