import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
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
  { href: "/search", label: "Pencarian Semantik", icon: Search },
  { href: "/copilot", label: "Kopilot AI", icon: Sparkles },
  { href: "/graph", label: "Grafik Pengetahuan", icon: Network },
  { href: "/gaps", label: "Penemuan Celah", icon: Lightbulb },
  { href: "/trends", label: "Tren Kebaruan", icon: TrendingUp },
  { href: "/collaborate", label: "Kolaborasi", icon: Users },
];

const LIB_ITEMS = [
  { href: "/papers", label: "Makalah Tersimpan", icon: Library },
  { href: "/collections", label: "Koleksi", icon: FolderHeart },
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
            <div className="leading-none min-w-0">
              <div className="font-black text-[13px] tracking-[0.08em] text-neutral-900">OASIS</div>
              <div className="font-medium text-[9px] tracking-[0.14em] text-neutral-500 -mt-0.5">Research</div>
            </div>
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
            {(!collapsed || isMobile) && <span>Beranda</span>}
          </div>
        </Link>

        {/* Modules */}
        <div>
          {(!collapsed || isMobile) && (
            <p className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase mb-2 px-3">
              Modul
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
              Perpustakaan
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
      <div className="p-3 border-t border-neutral-100 flex-shrink-0">
        <div className={`flex items-center gap-2.5 ${collapsed && !isMobile ? "justify-center" : ""}`}>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-7 h-7",
              },
            }}
          />
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <div className="text-xs font-medium text-neutral-700 truncate">Profil & Keluar</div>
            </div>
          )}
        </div>
      </div>
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
            <div className="leading-none">
              <div className="font-black text-[12px] tracking-[0.08em] text-neutral-900">OASIS</div>
              <div className="font-medium text-[8px] tracking-[0.14em] text-neutral-500 -mt-0.5">Research</div>
            </div>
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
