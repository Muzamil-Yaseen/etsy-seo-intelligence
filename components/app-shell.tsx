"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Search,
  FileText,
  Store,
  Tag,
  FolderTree,
  Cpu,
  History,
  Activity,
  DollarSign,
  Download,
  Settings,
  Shield,
  Menu,
  X,
  Plus,
  LogOut,
  Sparkles,
  Layers,
  ChevronDown,
  Bell,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { lockApp } from "@/components/access-gate";
import { getAdminSettings } from "@/lib/admin-settings";
import { ThemeToggle } from "@/components/theme-toggle";

export type ViewTab =
  | "dashboard"
  | "competitors"
  | "category"
  | "tags"
  | "keywords"
  | "listing"
  | "library"
  | "ai"
  | "reports"
  | "pricing"
  | "downloader";

interface AppShellProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onNewAnalysis: () => void;
  onOpenAdmin: () => void;
  onOpenDownloader: () => void;
  onOpenBulkDownloader?: () => void;
  onOpenFacts: () => void;
  onOpenHistory: () => void;
  savedCount?: number;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  currentTab,
  onSelectTab,
  onNewAnalysis,
  onOpenAdmin,
  onOpenDownloader,
  onOpenBulkDownloader,
  onOpenFacts,
  onOpenHistory,
  savedCount = 0,
  isAdmin = false,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [branding, setBranding] = useState(() => getAdminSettings().branding);

  useEffect(() => {
    const handleSettingsChanged = () => {
      setBranding(getAdminSettings().branding);
    };
    window.addEventListener("admin-settings-changed", handleSettingsChanged);
    return () => window.removeEventListener("admin-settings-changed", handleSettingsChanged);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Main navigation items requested:
  // 1st: Competitor Research
  // 2nd: Category Finder
  // 3rd: Tags Extractor
  // 4th: Main Keyword Finder
  const primaryNavItems: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "competitors", label: "Competitor Research", icon: Store },
    { id: "category", label: "Category Finder", icon: FolderTree },
    { id: "tags", label: "Tags Extractor", icon: Tag },
    { id: "keywords", label: "Main Keyword Finder", icon: Search },
  ];

  const handleTabClick = (tab: ViewTab) => {
    if (tab === "reports") {
      onOpenHistory();
    } else {
      onSelectTab(tab);
    }
    setMobileMenuOpen(false);
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case "dashboard":
      case "competitors":
        return { title: "Competitor Research", breadcrumb: "Benchmark Studio" };
      case "category":
        return { title: "Category Finder", breadcrumb: "Etsy Taxonomy & Media" };
      case "tags":
        return { title: "Tags Extractor", breadcrumb: "13-Tag Saturation" };
      case "keywords":
        return { title: "Main Keyword Finder", breadcrumb: "Search Volume & Intent" };
      case "listing":
        return { title: "Listing Analyzer", breadcrumb: "Optimization" };
      case "library":
        return { title: "Keyword Library", breadcrumb: "Assets" };
      case "ai":
        return { title: "AI Intelligence", breadcrumb: "Insights & Strategy" };
      case "pricing":
        return { title: "Pricing Calculator", breadcrumb: "Fee & Margin Intelligence" };
      case "downloader":
        return { title: "Media Downloader", breadcrumb: "Photos, Videos & Zip" };
      default:
        return { title: "Competitor Research", breadcrumb: "Overview" };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#070B14] text-slate-900 dark:text-[#F8FAFC] antialiased overflow-hidden font-sans transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. DESKTOP FIXED SIDEBAR                                                  */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-300 bg-white dark:bg-[#0B1019] border-r border-slate-200 dark:border-[#263244] shadow-xs ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <div>
          {/* Top Logo & App Title */}
          <div className={`h-16 border-b border-slate-200 dark:border-[#263244] flex items-center ${sidebarCollapsed ? "px-2 justify-center" : "px-4 justify-between"}`}>
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => onSelectTab("competitors")}
                className="relative w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#131C29] border border-emerald-200 dark:border-[#263244] p-1 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition"
                title={branding.appName || "Etsy Intelligence"}
              >
                <Image
                  src={branding.logoUrl || "/logo-icon.png"}
                  alt="Logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                  priority
                  unoptimized
                />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab("competitors")}
                  className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none min-w-0"
                  title={branding.appName || "Etsy Intelligence"}
                >
                  <div className="relative w-8 h-8 rounded-xl bg-emerald-50 dark:bg-[#131C29] border border-emerald-200 dark:border-[#263244] p-1 shrink-0 flex items-center justify-center">
                    <Image
                      src={branding.logoUrl || "/logo-icon.png"}
                      alt="Logo"
                      fill
                      sizes="32px"
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight truncate leading-none">
                        {branding.appName || "Etsy Intelligence"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-[#10B981] font-semibold tracking-wider uppercase mt-1 leading-none">
                      SEO Platform
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Navigation Links Area */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
            {/* Primary Section */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                  Main Navigation
                </div>
              )}
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id || (item.id === "competitors" && currentTab === "dashboard");
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer text-left relative ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-l-3 border-emerald-600 dark:border-emerald-500 shadow-xs"
                        : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-[#64748B]"}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>

            {/* TOOLS Section */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                  Tools
                </div>
              )}

              {/* 1st: Pricing Calculator */}
              <button
                type="button"
                onClick={() => handleTabClick("pricing")}
                title={sidebarCollapsed ? "Pricing Calculator" : undefined}
                className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer text-left relative ${
                  currentTab === "pricing"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-l-3 border-emerald-600 dark:border-emerald-500 shadow-xs"
                    : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                }`}
              >
                <DollarSign className={`w-4 h-4 shrink-0 ${currentTab === "pricing" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-[#64748B]"}`} />
                {!sidebarCollapsed && <span className="truncate">Pricing Calculator</span>}
              </button>

              {/* 2nd: Media Downloader */}
              <button
                type="button"
                onClick={() => handleTabClick("downloader")}
                title={sidebarCollapsed ? "Media Downloader" : undefined}
                className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer text-left relative ${
                  currentTab === "downloader"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-l-3 border-emerald-600 dark:border-emerald-500 shadow-xs"
                    : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                }`}
              >
                <Download className={`w-4 h-4 shrink-0 ${currentTab === "downloader" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-[#64748B]"}`} />
                {!sidebarCollapsed && <span className="truncate">Media Downloader</span>}
              </button>


            </div>

            {/* HISTORY Section */}
            <div className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                  History
                </div>
              )}
              <button
                type="button"
                onClick={onOpenHistory}
                title={sidebarCollapsed ? `Saved History (${savedCount})` : undefined}
                className="w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <History className="w-4 h-4 shrink-0 text-slate-400 dark:text-[#64748B]" />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate">Saved Reports</span>
                    {savedCount > 0 && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#172231] text-emerald-800 dark:text-emerald-400 font-bold">
                        {savedCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* ADMIN & SETTINGS - Only visible when Admin is authenticated */}
            {isAdmin && (
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  title={sidebarCollapsed ? "Admin Master Control" : undefined}
                  className="w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer text-left shadow-xs"
                >
                  <Shield className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="font-bold truncate">Admin Control</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold uppercase tracking-wider">
                        Full
                      </span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-slate-200 dark:border-[#263244] bg-slate-50 dark:bg-[#0F1621]">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#131C29] transition cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                  isAdmin ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
                }`}
                title={isAdmin ? "Muzamil (Owner)" : "Etsy Seller"}
              >
                {isAdmin ? "M" : "E"}
              </div>
              <button
                type="button"
                onClick={() => lockApp()}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-[#131C29] transition cursor-pointer shrink-0"
                title="Lock application session"
                aria-label="Lock application session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                    isAdmin ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
                  }`}
                >
                  {isAdmin ? "M" : "E"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] leading-none truncate">
                    {isAdmin ? "Muzamil" : "Etsy Seller"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-none mt-1 ${
                      isAdmin ? "text-emerald-600 dark:text-[#10B981]" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {isAdmin ? "👑 Owner · Full Control" : "✓ Active Access"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => lockApp()}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-[#131C29] transition cursor-pointer shrink-0"
                title="Lock application session"
                aria-label="Lock application session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN APPLICATION CONTENT AREA                                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Announcement Banner (if configured) */}
        {branding.announcementBanner?.enabled && branding.announcementBanner.text && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shrink-0">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{branding.announcementBanner.text}</span>
          </div>
        )}

        {/* Top Header Bar (Corelystic Inspired) */}
        <header className="h-16 border-b border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B1019] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20 shadow-xs">
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#263244] flex items-center justify-center text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-200 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                {pageInfo.title}
              </h1>
              <span className="hidden sm:inline-block text-xs text-slate-300 dark:text-[#36445A]">/</span>
              <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-[#94A3B8]">
                {pageInfo.breadcrumb}
              </span>
            </div>
          </div>

          {/* Center/Right: Quick Search, Bell, Theme Toggle Switch, and Actions */}
          <div className="flex items-center gap-3">


            {/* Custom Sun/Moon Switch Toggle Provided by User */}
            <ThemeToggle />

            {/* New Analysis Primary CTA */}
            <button
              type="button"
              onClick={onNewAnalysis}
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Analysis</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#070B14] p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1500px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE NAVIGATION DRAWER (< 768px)                                     */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-[280px] max-w-[80vw] bg-white dark:bg-[#0B1019] border-r border-slate-200 dark:border-[#263244] h-full flex flex-col justify-between p-4 z-10 shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-200 dark:border-[#263244]">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-lg bg-emerald-50 dark:bg-[#131C29] border border-emerald-200 dark:border-[#263244] p-1">
                    <Image
                      src={branding.logoUrl || "/logo-icon.png"}
                      alt="Logo"
                      fill
                      sizes="28px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                    {branding.appName || "Etsy Intelligence"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-[#94A3B8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav Items */}
              <div className="space-y-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id || (item.id === "competitors" && currentTab === "dashboard");
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer text-left ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-l-3 border-emerald-600"
                          : "text-slate-600 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="pt-3 my-2 border-t border-slate-200 dark:border-[#263244]" />

                <button
                  type="button"
                  onClick={() => handleTabClick("pricing")}
                  className="w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 text-slate-600 dark:text-[#94A3B8]"
                >
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>Pricing Calculator</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("downloader")}
                  className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer text-left ${
                    currentTab === "downloader"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-l-3 border-emerald-600"
                      : "text-slate-600 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <Download className={`w-4 h-4 ${currentTab === "downloader" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                  <span>Media Downloader</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenHistory();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 text-slate-600 dark:text-[#94A3B8]"
                >
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Saved Reports</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAdmin();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-3 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">Admin Master Control</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#263244] flex items-center justify-between text-xs text-slate-600 dark:text-[#94A3B8]">
              <span>{isAdmin ? "Muzamil · Owner (Full Control)" : "Etsy Seller · Active Member"}</span>
              <button
                type="button"
                onClick={() => lockApp()}
                className="text-rose-500 hover:underline font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
