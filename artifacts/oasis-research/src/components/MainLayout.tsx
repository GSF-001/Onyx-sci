import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { LogOut } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const { signOut } = useClerk();

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-[#080808]">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
        <Link href="/home" className="flex items-center gap-2.5 cursor-pointer min-w-0">
          <img
            src="/onyx-logo-transparent.png"
            alt="ONYX"
            className="flex-shrink-0 object-contain"
            style={{ width: collapsed && !isMobile ? 28 : 32, height: collapsed && !isMobile ? 28 : 32 }}
          />
          {(!collapsed || isMobile) && (
            <div className="leading-none min-w-0">
              <div className="font-black text-[15px] tracking-[0.12em] text-white">ONYX</div>
              <div className="font-medium text-[8px] tracking-[0.22em] text-neutral-500 -mt-0.5 uppercase">research</div>
            </div>
          )}
        </Link>
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/8 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-white/8 transition-colors flex-shrink-0"
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
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
              location === "/home"
                ? "bg-white/10 text-white font-medium shadow-[0_0_12px_rgba(255,255,255,0.04)]"
                : "text-neutral-500 hover:text-neutral-200 hover:bg-white/6"
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
            <p className="text-[9px] font-bold text-neutral-600 tracking-widest uppercase mb-2 px-3">
              Modules
            </p>
          )}
          {collapsed && !isMobile && <div className="h-px bg-white/5 mx-2 mb-3" />}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                      isActive
                        ? "bg-white/10 text-white font-medium shadow-[0_0_12px_rgba(255,255,255,0.04)]"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-white/6"
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
            <p className="text-[9px] font-bold text-neutral-600 tracking-widest uppercase mb-2 px-3">
              Library
            </p>
          )}
          {collapsed && !isMobile && <div className="h-px bg-white/5 mx-2 mb-3" />}
          <nav className="space-y-0.5">
            {LIB_ITEMS.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                      isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-white/6"
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
      <div className="p-3 border-t border-white/5 flex-shrink-0">
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-600 hover:text-red-400 hover:bg-red-500/8 transition-colors ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-neutral-100 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-white/5 bg-[#080808] flex-shrink-0 overflow-hidden
          transition-[width] duration-200 ease-in-out`}
        style={{ width: collapsed ? 52 : 220 }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-[240px] bg-[#080808] border-r border-white/5 flex flex-col
          transform transition-transform duration-200 ease-in-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent isMobile />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 h-14 border-b border-white/5 bg-[#080808] flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/home" className="flex items-center gap-2.5">
            <img src="/onyx-logo-transparent.png" alt="ONYX" className="w-7 h-7 object-contain" />
            <div className="leading-none">
              <div className="font-black text-[14px] tracking-[0.12em] text-white">ONYX</div>
              <div className="font-medium text-[8px] tracking-[0.2em] text-neutral-500 -mt-0.5 uppercase">research</div>
            </div>
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#050505]">
          {children}
        </main>
      </div>
    </div>
  );
}
