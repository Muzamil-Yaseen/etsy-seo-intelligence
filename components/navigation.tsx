"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Tag,
  Type,
  FileText,
  BarChart3,
  UploadCloud,
  Store,
  FlaskConical,
  Settings,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/research", label: "Keyword Research", icon: Search },
    { href: "/tags", label: "Tag Optimizer", icon: Tag },
    { href: "/title", label: "Title Optimizer", icon: Type },
    { href: "/description", label: "Description Optimizer", icon: FileText },
    { href: "/analyzer", label: "Listing Analyzer", icon: BarChart3 },
    { href: "/imports", label: "Marketplace Insights", icon: UploadCloud },
    { href: "/shops", label: "Connected Shops", icon: Store },
    { href: "/experiments", label: "Experiments", icon: FlaskConical },
    { href: "/settings", label: "Data Sources & Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/60 backdrop-blur-md flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
                E
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white tracking-tight">Etsy SEO Intelligence</h1>
                <p className="text-[11px] text-neutral-400">Marketplace Evidence SaaS</p>
              </div>
            </div>

            {/* Active Workspace / Project Selector */}
            <div className="mt-3.5 p-2 bg-neutral-800/60 rounded-md border border-neutral-700/60 text-xs">
              <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Active Project</div>
              <div className="font-medium text-neutral-200 truncate mt-0.5">Heritage Leather Wallets SEO</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-orange-600/15 text-orange-400 border border-orange-500/30"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-400" : "text-neutral-500"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Provenance & Compliance Badge */}
        <div className="p-3 border-t border-neutral-800 text-[11px] space-y-2 bg-neutral-900/90">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Scraping Guaranteed</span>
          </div>
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            Marketplace metrics verified through Etsy Open API v3 &amp; direct user imports.
          </p>
        </div>
      </aside>

      {/* Main Content Area with Header & Mandatory Etsy Attribution Footer */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-12 border-b border-neutral-800 bg-neutral-900/40 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Workspace:</span>
            <span className="text-neutral-200 font-medium">Craft &amp; Timber Studio</span>
            <span className="text-neutral-600">/</span>
            <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
              Scoring Engine: v1.0.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/imports"
              className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded border border-neutral-700 transition"
            >
              + Import Etsy Insights
            </Link>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* The page content renders here */}
            {/* Note: This component wraps the main layout */}
          </div>
        </main>

        {/* Mandatory Etsy Trademark Attribution Statement */}
        <footer className="border-t border-neutral-900 bg-neutral-950/80 px-6 py-2 text-center shrink-0">
          <p className="text-[11px] text-neutral-400">
            The term &lsquo;Etsy&rsquo; is a trademark of Etsy, Inc. This Application uses Etsy&apos;s API, but is not endorsed or certified by Etsy.
          </p>
        </footer>
      </div>
    </div>
  );
}
