import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Sparkles,
  Network,
  Lightbulb,
  TrendingUp,
  Users,
  Library,
  FolderHeart,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import OasisLogo from "./OasisLogo";

interface MainLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/search", label: "Semantic Search", icon: Search },
  { href: "/copilot", label: "AI Copilot", icon: Sparkles },
  { href: "/graph", label: "Knowledge Graph", icon: Network },
  { href: "/gaps", label: "Gap Discovery", icon: Lightbulb },
  { href: "/trends", label: "Novelty Trends", icon: TrendingUp },
  { href: "/collaborate", label: "Collaborate", icon: Users },
];

const LIB_ITEMS = [
  { href: "/papers", label: "Saved Papers", icon: Library },
  { href: "/collections", label: "Collections", icon: FolderHeart },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);   // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // mobile
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  // Prevent scroll on body when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-100 flex-shrink-0">
        <Link href="/home" className="flex items-center gap-2.5 cursor-pointer min-w-0">
          <OasisLogo size={24} color="#111" className="flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="font-bold text-[13px] tracking-tight text-neutral-900 truncate">
              OASIS-Research
            </span>
          )}
        </Link>
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-4">
        {/* Home */}
        <Link href="/home">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
              location === "/home"
                ? "bg-neutral-100 text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
            } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
            title={collapsed && !isMobile ? "Home" : undefined}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Home</span>}
          </div>
        </Link>

        {/* Modules */}
        <div>
          {(!collapsed || isMobile) && (
            <p className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-2 px-3">
              Modules
            </p>
          )}
          {collapsed && !isMobile && <div className="h-px bg-neutral-100 mx-2 mb-3" />}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isActive
                        ? "bg-neutral-100 text-neutral-900 font-medium"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
                    title={collapsed && !isMobile ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {(!collapsed || isMobile) && <span>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Library */}
        <div>
          {(!collapsed || isMobile) && (
            <p className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-2 px-3">
              Library
            </p>
          )}
          {collapsed && !isMobile && <div className="h-px bg-neutral-100 mx-2 mb-3" />}
          <nav className="space-y-0.5">
            {LIB_ITEMS.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isActive
                        ? "bg-neutral-100 text-neutral-900 font-medium"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
                    title={collapsed && !isMobile ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {(!collapsed || isMobile) && <span>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <div className="p-3 border-t border-neutral-100 flex-shrink-0">
          <Link href="/">
            <div className="px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer">
              ← Back to Landing
            </div>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-white text-neutral-900 font-sans overflow-hidden">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden md:flex flex-col border-r border-neutral-100 bg-white flex-shrink-0 overflow-hidden
          transition-[width] duration-200 ease-in-out`}
        style={{ width: collapsed ? 56 : 240 }}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY + DRAWER ── */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-[260px] bg-white border-r border-neutral-100 flex flex-col
          transform transition-transform duration-200 ease-in-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent isMobile />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 h-14 border-b border-neutral-100 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/home" className="flex items-center gap-2">
            <OasisLogo size={22} color="#111" />
            <span className="font-bold text-[13px] tracking-tight text-neutral-900">OASIS-Research</span>
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
