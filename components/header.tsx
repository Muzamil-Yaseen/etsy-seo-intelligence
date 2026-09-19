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
} from "lucide-react";

export type NavItem = "research" | "keywords" | "competitors" | "listing" | "pricing";

interface HeaderProps {
  activeNav: NavItem;
  onSelectNav: (item: NavItem) => void;
  onNewAnalysis: () => void;
  onOpenHistory: () => void;
  savedCount?: number;
  onOpenFacts?: () => void;
  onOpenDownloader?: () => void;
}

export function Header({
  activeNav,
  onSelectNav,
  onNewAnalysis,
  onOpenHistory,
  savedCount = 0,
  onOpenFacts,
  onOpenDownloader,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    backgroundColor: isScrolled ? "rgba(10, 20, 40, 0.86)" : "rgba(10, 20, 40, 0.72)",
    backdropFilter: isScrolled ? "blur(24px) saturate(150%)" : "blur(20px) saturate(140%)",
    WebkitBackdropFilter: isScrolled ? "blur(24px) saturate(150%)" : "blur(20px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: isScrolled ? "0 12px 36px rgba(0, 0, 0, 0.28)" : "0 8px 30px rgba(0, 0, 0, 0.16)",
    transition: "all 220ms ease-out",
  };

  const bottomNavStyle: React.CSSProperties = {
    backgroundColor: "rgba(10, 20, 40, 0.90)",
    backdropFilter: "blur(20px) saturate(140%)",
    WebkitBackdropFilter: "blur(20px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    boxShadow: "0 10px 32px rgba(0, 0, 0, 0.35)",
  };

  const bottomSheetStyle: React.CSSProperties = {
    backgroundColor: "rgba(10, 20, 40, 0.96)",
    backdropFilter: "blur(24px) saturate(140%)",
    WebkitBackdropFilter: "blur(24px) saturate(140%)",
    borderTop: "1px solid rgba(255, 255, 255, 0.10)",
    borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 -12px 40px rgba(0, 0, 0, 0.45)",
  };

  return (
    <>
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
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg py-1 transition-opacity hover:opacity-90 cursor-pointer"
              aria-label="Etsy Intelligence Home"
            >
              {/* Desktop Full Logo */}
              <div className="hidden sm:block relative w-[165px] h-[30px]">
                <Image
                  src="/logo-white-trimmed.png"
                  alt="Etsy Intelligence"
                  fill
                  sizes="165px"
                  className="object-contain object-left"
                  priority
                  unoptimized
                />
              </div>
              {/* Mobile Icon Logo */}
              <div className="block sm:hidden relative w-[32px] h-[32px]">
                <Image
                  src="/logo-icon.png"
                  alt="Etsy Intelligence"
                  fill
                  sizes="32px"
                  className="object-contain rounded-lg"
                  priority
                  unoptimized
                />
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
                      ? "text-white font-semibold bg-emerald-500/10 after:content-[''] after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[2px] after:bg-emerald-500/80 after:rounded-full"
                      : "text-white/60 font-medium hover:text-white/90 hover:bg-white/[0.04]"
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
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
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
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
                aria-label="Listing Downloader"
                title="Download Etsy listing photos and metadata"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Downloader</span>
              </button>
            )}

            {/* Desktop History Ghost Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer"
              aria-label="History"
              title="View analysis history"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>History</span>
            </button>

            {/* Primary Action Button: New Analysis */}
            <button
              type="button"
              onClick={() => {
                onNewAnalysis();
                setMobileMenuOpen(false);
              }}
              className="h-[36px] sm:h-[38px] px-3 sm:px-3.5 rounded-[9px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
              aria-label="Start New Analysis"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>

            {/* Dedicated Mobile Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden relative z-[10001] w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer pointer-events-auto"
              aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                  ? "text-emerald-400 font-semibold"
                  : "text-white/60 hover:text-white font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-white/60"}`} />
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
              ? "text-emerald-400 font-semibold"
              : "text-white/60 hover:text-white font-medium"
          }`}
          aria-label="More navigation options"
        >
          <MoreHorizontal className="w-4 h-4" />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] md:hidden transition-opacity animate-in fade-in duration-200 pointer-events-auto"
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
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative">
                  <Image
                    src="/logo-icon.png"
                    alt="Etsy Intelligence"
                    fill
                    sizes="24px"
                    className="object-contain rounded-md"
                    unoptimized
                  />
                </div>
                <span className="text-xs font-semibold tracking-tight text-white">
                  Etsy Intelligence
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.12] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
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
                        ? "text-white font-semibold bg-emerald-500/10"
                        : "text-white/70 font-medium hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-white/60"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Subtle Separator */}
            <div className="border-t border-white/[0.08] my-2" />

            {/* Secondary Rows: History & Product Facts */}
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  onOpenHistory();
                  setMobileMenuOpen(false);
                }}
                className="w-full h-[50px] px-3.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.04] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>History</span>
                </div>
                {savedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200">
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
                  className="w-full h-[50px] px-3.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.04] flex items-center gap-3 transition-colors cursor-pointer"
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
                  className="w-full h-[50px] px-3.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.04] flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Listing Downloader</span>
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
                className="w-full h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
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
