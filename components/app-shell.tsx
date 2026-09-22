"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Search,
  FileText,
  Store,
  Tag,
  Cpu,
  History,
  Activity,
  Settings,
  Shield,
  Menu,
  X,
  Plus,
  LogOut,
  Sparkles,
} from "lucide-react";
import { lockApp } from "@/components/access-gate";
import { getAdminSettings } from "@/lib/admin-settings";

export type ViewTab =
  | "dashboard"
  | "keywords"
  | "listing"
  | "competitors"
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
  onOpenFacts: () => void;
  onOpenHistory: () => void;
  savedCount?: number;
  children: React.ReactNode;
}

export function AppShell({
  currentTab,
  onSelectTab,
  onNewAnalysis,
  onOpenAdmin,
  onOpenDownloader,
  onOpenFacts,
  onOpenHistory,
  savedCount = 0,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Main navigation items
  const mainNavItems: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "keywords", label: "Keyword Research", icon: Search },
    { id: "listing", label: "Listing Analyzer", icon: FileText },
    { id: "competitors", label: "Competitor Research", icon: Store },
    { id: "library", label: "Keyword Library", icon: Tag },
    { id: "ai", label: "AI Intelligence", icon: Cpu },
    { id: "reports", label: "Saved Reports", icon: History },
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
        return { title: "Dashboard", breadcrumb: "Overview" };
      case "keywords":
        return { title: "Keyword Research", breadcrumb: "Market Intelligence" };
      case "listing":
        return { title: "Listing Analyzer", breadcrumb: "Optimization" };
      case "competitors":
        return { title: "Competitor Research", breadcrumb: "Benchmark" };
      case "library":
        return { title: "Keyword Library", breadcrumb: "Assets" };
      case "ai":
        return { title: "AI Intelligence", breadcrumb: "Insights & Strategy" };
      case "pricing":
        return { title: "Pricing Calculator", breadcrumb: "Fee & Margin Intelligence" };
      case "downloader":
        return { title: "Listing Downloader", breadcrumb: "Media & Metadata Extraction" };
      default:
        return { title: "Dashboard", breadcrumb: "Overview" };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="flex h-screen w-full bg-[#070B14] text-[#F8FAFC] antialiased overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* 1. DESKTOP FIXED SIDEBAR (250px)                                          */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-[250px] border-r border-[#263244] bg-[#0B1019] flex-col justify-between shrink-0 select-none z-30">
        <div>
          {/* Top Logo & App Title */}
          <div className="h-16 px-5 border-b border-[#263244] flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSelectTab("dashboard")}
              className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
            >
              <div className="relative w-8 h-8 rounded-[8px] bg-[#131C29] border border-[#263244] p-1 shrink-0">
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
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#F8FAFC] tracking-tight leading-none">
                  {branding.appName || "Etsy Intelligence"}
                </span>
                <span className="text-[10px] text-[#94A3B8] font-medium tracking-wider uppercase mt-1 leading-none">
                  SEO Platform
                </span>
              </div>
            </button>
          </div>

          {/* Main Navigation */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Intelligence
              </div>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full h-10 px-3 rounded-[10px] text-sm font-medium flex items-center gap-2.5 transition cursor-pointer text-left relative ${
                      isActive
                        ? "bg-[#14B8A6]/10 text-[#F8FAFC] font-semibold"
                        : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#14B8A6] rounded-r" />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#2DD4BF]" : "text-[#64748B]"}`} />
                    <span className="truncate">{item.label}</span>
                    {item.id === "reports" && savedCount > 0 && (
                      <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full bg-[#172231] text-[#94A3B8]">
                        {savedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Secondary Navigation */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Tools &amp; Settings
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("pricing")}
                className={`w-full h-10 px-3 rounded-[10px] text-sm font-medium flex items-center gap-2.5 transition cursor-pointer text-left relative ${
                  currentTab === "pricing"
                    ? "bg-[#14B8A6]/10 text-[#F8FAFC] font-semibold"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                }`}
              >
                {currentTab === "pricing" && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#14B8A6] rounded-r" />
                )}
                <Activity className="w-4 h-4 text-[#64748B]" />
                <span>Pricing Calculator</span>
              </button>

              <button
                type="button"
                onClick={onOpenDownloader}
                className="w-full h-10 px-3 rounded-[10px] text-sm font-medium flex items-center gap-2.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <FileText className="w-4 h-4 text-[#64748B]" />
                <span>Media Downloader</span>
              </button>

              <button
                type="button"
                onClick={onOpenFacts}
                className="w-full h-10 px-3 rounded-[10px] text-sm font-medium flex items-center gap-2.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-[#64748B]" />
                <span>Product Facts</span>
              </button>

              {/* Admin Button */}
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full h-10 px-3 rounded-[10px] text-sm font-semibold flex items-center gap-2.5 text-[#14B8A6] hover:text-[#2DD4BF] hover:bg-[#14B8A6]/10 transition cursor-pointer text-left"
              >
                <Shield className="w-4 h-4 text-[#14B8A6]" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-[#263244] bg-[#0F1621] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#131C29] border border-[#263244] flex items-center justify-center font-bold text-xs text-[#14B8A6]">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#F8FAFC] leading-none">Muzamil</span>
              <span className="text-[10px] text-[#14B8A6] font-medium leading-none mt-1">Owner</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => lockApp()}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#64748B] hover:text-[#F43F5E] hover:bg-[#131C29] transition cursor-pointer"
            title="Lock application session"
            aria-label="Lock application session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN APPLICATION CONTENT AREA                                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Announcement Banner (if configured) */}
        {branding.announcementBanner?.enabled && branding.announcementBanner.text && (
          <div className="bg-[#14B8A6] text-[#021A17] text-xs font-semibold py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shrink-0">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{branding.announcementBanner.text}</span>
          </div>
        )}

        {/* Top Bar (64px) */}
        <header className="h-16 border-b border-[#1E293B] bg-[#0B1019] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20">
          {/* Left: Current Page Title & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-[8px] bg-[#111827] border border-[#263244] flex items-center justify-center text-[#F8FAFC] hover:bg-[#172231] cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#F8FAFC] tracking-tight">
                {pageInfo.title}
              </h1>
              <span className="hidden sm:inline-block text-xs text-[#36445A]">/</span>
              <span className="hidden sm:inline-block text-xs text-[#94A3B8]">
                {pageInfo.breadcrumb}
              </span>
            </div>
          </div>

          {/* Right: AI Status, Quick Actions, and Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* AI Provider Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F1621] border border-[#263244] text-xs text-[#94A3B8]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Groq Online</span>
            </div>

            {/* Primary Action Button: New Analysis */}
            <button
              type="button"
              onClick={onNewAnalysis}
              className="h-9 px-3.5 rounded-[10px] bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#021A17] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>

            {/* Admin Shortcut */}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-[#172231] hover:bg-[#1E293B] border border-[#263244] text-xs font-medium text-[#E2E8F0] transition cursor-pointer"
              title="Open Admin Panel"
            >
              <Shield className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>Admin</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-[#070B14] p-4 sm:p-6 lg:p-8">
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[80vw] bg-[#0B1019] border-r border-[#263244] h-full flex flex-col justify-between p-4 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-[#263244]">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-[8px] bg-[#131C29] border border-[#263244] p-1">
                    <Image
                      src={branding.logoUrl || "/logo-icon.png"}
                      alt="Logo"
                      fill
                      sizes="28px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="font-bold text-sm text-[#F8FAFC]">
                    {branding.appName || "Etsy Intelligence"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131C29]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav Items */}
              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full h-11 px-3 rounded-[10px] text-sm font-medium flex items-center gap-3 transition cursor-pointer text-left ${
                        isActive
                          ? "bg-[#14B8A6]/10 text-[#F8FAFC] font-semibold border-l-2 border-[#14B8A6]"
                          : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#2DD4BF]" : "text-[#64748B]"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="pt-3 my-2 border-t border-[#263244]" />

                <button
                  type="button"
                  onClick={() => {
                    onSelectTab("pricing");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-[10px] text-sm font-medium flex items-center gap-3 text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <Activity className="w-4 h-4 text-[#64748B]" />
                  <span>Pricing Calculator</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenDownloader();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-[10px] text-sm font-medium flex items-center gap-3 text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <FileText className="w-4 h-4 text-[#64748B]" />
                  <span>Media Downloader</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-11 px-3 rounded-[10px] text-sm font-semibold flex items-center gap-3 text-[#14B8A6]"
                >
                  <Shield className="w-4 h-4 text-[#14B8A6]" />
                  <span>Admin Panel</span>
                </button>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="pt-3 border-t border-[#263244] flex items-center justify-between text-xs text-[#94A3B8]">
              <span>Muzamil · Owner</span>
              <button
                type="button"
                onClick={() => lockApp()}
                className="text-[#F43F5E] hover:underline"
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
