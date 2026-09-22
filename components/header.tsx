"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  History,
  Plus,
  Menu,
  X,
  ShieldCheck,
  Search,
  Tags,
  Store,
  FileText,
  DollarSign,
  MoreHorizontal,
  Download,
  Laptop,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { getAdminSettings } from "@/lib/admin-settings";

export type NavItem = "research" | "keywords" | "competitors" | "listing" | "pricing";

interface HeaderProps {
  activeNav: NavItem;
  onSelectNav: (item: NavItem) => void;
  onNewAnalysis: () => void;
  onOpenHistory: () => void;
  savedCount?: number;
  onOpenFacts?: () => void;
  onOpenDownloader?: () => void;
  onOpenDeviceManager?: () => void;
  onOpenMasterAdmin?: () => void;
}

export function Header({
  activeNav,
  onSelectNav,
  onNewAnalysis,
  onOpenHistory,
  savedCount = 0,
  onOpenFacts,
  onOpenDownloader,
  onOpenDeviceManager,
  onOpenMasterAdmin,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branding, setBranding] = useState(() => getAdminSettings().branding);

  useEffect(() => {
    const handleSettingsChanged = () => {
      setBranding(getAdminSettings().branding);
    };
    window.addEventListener("admin-settings-changed", handleSettingsChanged);
    return () => window.removeEventListener("admin-settings-changed", handleSettingsChanged);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open, restore when closed
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

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navItems: {
    id: NavItem;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "research", label: "Research", icon: Search },
    { id: "keywords", label: "Keywords", icon: Tags },
    { id: "competitors", label: "Competitors", icon: Store },
    { id: "listing", label: "Listing", icon: FileText },
    { id: "pricing", label: "Pricing", icon: DollarSign },
  ];

  const handleNavClick = (id: NavItem) => {
    onSelectNav(id);
    setMobileMenuOpen(false);
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: "#000000",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow: "0 10px 32px rgba(0, 0, 0, 0.5)",
    transition: "all 220ms ease-out",
  };

  const bottomNavStyle: React.CSSProperties = {
    backgroundColor: "#000000",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "20px",
    boxShadow: "0 10px 32px rgba(0, 0, 0, 0.6)",
  };

  const bottomSheetStyle: React.CSSProperties = {
    backgroundColor: "#000000",
    borderTop: "1px solid rgba(255, 255, 255, 0.16)",
    borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
    borderRight: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 -12px 40px rgba(0, 0, 0, 0.7)",
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 0. ANNOUNCEMENT BANNER (Configurable via Master Admin)                     */}
      {/* ========================================================================= */}
      {branding.announcementBanner?.enabled && branding.announcementBanner.text && (
        <div className="w-full bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-xs z-50 relative">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{branding.announcementBanner.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP FLOATING GLASS HEADER (Desktop & Mobile Top Bar)                   */}
      {/* ========================================================================= */}
      <div className="sticky top-[10px] sm:top-[14px] z-50 px-2.5 sm:px-6 max-w-[1440px] mx-auto w-full pointer-events-none">
        <header
          aria-label="Etsy Intelligence main header"
          style={headerStyle}
          className="pointer-events-auto w-full h-[56px] sm:h-[64px] rounded-[16px] px-3.5 sm:px-5 md:px-6 flex items-center justify-between"
        >
          {/* LEFT: Brand Logo */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleNavClick("research")}
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-xl py-1 transition-opacity hover:opacity-90 cursor-pointer text-left"
              aria-label="Etsy Intelligence Home"
            >
              {/* Brand Logo Icon */}
              <div className="relative w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] shrink-0">
                <Image
                  src={branding.logoUrl || "/logo-icon.png"}
                  alt={branding.appName || "Etsy Intelligence"}
                  fill
                  sizes="(max-width: 640px) 32px, 36px"
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              {/* Brand Typography */}
              <div className="flex flex-col">
                <span className="font-heading text-[14px] sm:text-[16px] font-bold text-white tracking-tight leading-none">
                  {branding.appName || "Etsy Intelligence"}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-emerald-400 font-mono font-medium tracking-wider uppercase mt-1 leading-none">
                  {branding.headerBadgeText || "SEO & Market Studio"}
                </span>
              </div>
            </button>
          </div>

          {/* CENTER: Desktop Primary Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-1 lg:gap-1.5"
          >
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-xs tracking-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer ${
                    isActive
                      ? "text-white font-semibold bg-white/15 after:content-[''] after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[2px] after:bg-emerald-400 after:rounded-full"
                      : "text-white/80 font-medium hover:text-white hover:bg-white/10"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Utility Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Desktop Product Facts Button */}
            {onOpenFacts && (
              <button
                type="button"
                onClick={onOpenFacts}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
                aria-label="Product Facts"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Product Facts</span>
              </button>
            )}

            {/* Desktop Downloader Button */}
            {onOpenDownloader && (
              <button
                type="button"
                onClick={onOpenDownloader}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
                aria-label="Listing Downloader"
                title="Download Etsy listing photos and metadata"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Downloader</span>
              </button>
            )}

            {/* Desktop Devices & Apps Management Button */}
            {onOpenDeviceManager && (
              <button
                type="button"
                onClick={onOpenDeviceManager}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
                aria-label="Manage Devices & Apps"
                title="Manage authorized devices, connected apps & secret key"
              >
                <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                <span>Devices &amp; Apps</span>
              </button>
            )}

            {/* Master Admin Button */}
            {onOpenMasterAdmin && (
              <button
                type="button"
                onClick={onOpenMasterAdmin}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
                aria-label="Master Admin Panel"
                title="Open Muzamil's Master Admin Panel"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Desktop History Ghost Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
              aria-label="History"
              title="View analysis history"
            >
              <History className="w-3.5 h-3.5 text-white" />
              <span>History</span>
            </button>

            {/* Primary Action Button: New Analysis */}
            <button
              type="button"
              onClick={() => {
                onNewAnalysis();
                setMobileMenuOpen(false);
              }}
              className="font-heading h-[36px] sm:h-[38px] px-3 sm:px-3.5 rounded-[9px] bg-black hover:bg-zinc-900 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
              aria-label="Start New Analysis"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>

            {/* Dedicated Mobile Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden relative z-[10001] w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer pointer-events-auto"
              aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </header>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE BOTTOM NAVIGATION DOCK (Persistent Thumb Bar < 768px)          */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile bottom navigation"
        style={bottomNavStyle}
        className="md:hidden fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-3 right-3 z-40 max-w-lg mx-auto h-[60px] px-1.5 flex items-center justify-around pointer-events-auto"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex-1 h-full min-w-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer rounded-xl ${
                isActive
                  ? "text-emerald-400 font-bold"
                  : "text-white hover:text-white font-medium hover:bg-white/10"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-white"}`} />
              <span className="text-[10px] tracking-tight leading-none">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 -mt-0.5" />
              )}
            </button>
          );
        })}

        {/* More Menu Action in Bottom Bar */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`flex-1 h-full min-w-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer rounded-xl relative ${
            mobileMenuOpen
              ? "text-emerald-400 font-bold"
              : "text-white hover:text-white font-medium hover:bg-white/10"
          }`}
          aria-label="More navigation options"
        >
          <MoreHorizontal className={`w-4 h-4 ${mobileMenuOpen ? "text-emerald-400" : "text-white"}`} />
          <span className="text-[10px] tracking-tight leading-none">More</span>
          {savedCount > 0 && !mobileMenuOpen && (
            <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM MENU / BOTTOM SHEET DRAWER (< 768px)                     */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop for outside tap */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[9998] md:hidden transition-opacity animate-in fade-in duration-200 pointer-events-auto"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile bottom menu"
            style={bottomSheetStyle}
            className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden rounded-t-[24px] p-4 pb-[max(24px,env(safe-area-inset-bottom))] max-h-[85dvh] overflow-y-auto animate-in slide-in-from-bottom duration-200 pointer-events-auto shadow-2xl"
          >
            {/* Sheet Drag Indicator Handle */}
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-3" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-white/[0.12]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 relative shrink-0">
                  <Image
                    src="/logo-icon.png"
                    alt="Etsy Intelligence"
                    fill
                    sizes="28px"
                    className="object-contain rounded-md"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-xs font-bold tracking-tight text-white leading-tight">
                    Etsy Intelligence
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono leading-none mt-0.5">
                    SEO &amp; Research Studio
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.10] hover:bg-white/[0.20] flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Primary Navigation Rows */}
            <div className="flex flex-col gap-0.5 mt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full h-[50px] px-3.5 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? "text-white font-bold bg-white/20"
                        : "text-white font-medium hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-white"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Subtle Separator */}
            <div className="border-t border-white/[0.12] my-2" />

            {/* Secondary Rows: History & Product Facts */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  onOpenHistory();
                  setMobileMenuOpen(false);
                }}
                className="w-full h-[50px] px-3.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-white" />
                  <span>History</span>
                </div>
                {savedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                    {savedCount}
                  </span>
                )}
              </button>

              {onOpenFacts && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenFacts();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-[50px] px-3.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Product Facts</span>
                </button>
              )}

              {onOpenDownloader && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDownloader();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-[50px] px-3.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Listing Downloader</span>
                </button>
              )}

              {onOpenDeviceManager && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDeviceManager();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-[50px] px-3.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>Devices &amp; Apps</span>
                </button>
              )}

              {onOpenMasterAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMasterAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full h-[50px] px-3.5 rounded-xl text-sm font-bold text-emerald-400 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Master Admin Panel</span>
                </button>
              )}
            </div>

            {/* Bottom Primary Action: New Analysis */}
            <div className="mt-3 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  onNewAnalysis();
                  setMobileMenuOpen(false);
                }}
                className="font-heading w-full h-[46px] rounded-xl bg-black hover:bg-zinc-900 border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Analysis</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
