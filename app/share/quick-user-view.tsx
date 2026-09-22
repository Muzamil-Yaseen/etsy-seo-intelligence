"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Tag,
  Copy,
  Check,
  Download,
  X,
  History,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Camera,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Store,
  Info,
  ShieldCheck,
  AlertCircle,
  Database,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Plus,
} from "lucide-react";
import { AccessGate, lockApp } from "@/components/access-gate";
import {
  HistoryDrawer,
  saveListingToHistory,
  getSavedListings,
  SavedListing,
} from "@/components/history-drawer";
import { PricingCalculator } from "@/components/pricing-calculator";
import { ProductFactsDrawer } from "@/components/product-facts-drawer";
import { DataDetailsDrawer } from "@/components/data-details-drawer";
import { Header, NavItem } from "@/components/header";
import {
  ListingDownloaderModal,
  ListingDownloaderData,
} from "@/components/listing-downloader-modal";
import { DevicesAppsModal } from "@/components/devices-apps-modal";
import { ProductFacts } from "@/lib/product-facts/types";

// Clean example presets
const PRESETS = [
  {
    name: "Ceramic Mugs",
    description: "Wheel-thrown stoneware coffee mugs",
    query: "handmade ceramic coffee mug",
  },
  {
    name: "Leather Wallets",
    description: "Full-grain leather bifold wallets",
    query: "personalized leather wallet",
  },
  {
    name: "Silver Jewelry",
    description: "925 sterling silver birth flower necklaces",
    query: "sterling silver birth flower necklace",
  },
  {
    name: "Wood Cutting Boards",
    description: "End-grain walnut charcuterie boards",
    query: "personalized walnut cutting board",
  },
];

type MainTab = "overview" | "keywords" | "competitors" | "listing" | "pricing" | "photos";
type ListingSubTab = "titles" | "description" | "faqs";
type ApplicationMode = "research" | "optimize";

export function QuickUserView() {
  // Mode State: Mode A (Research) vs Mode B (Optimize)
  const [appMode, setAppMode] = useState<ApplicationMode>("research");

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [listingSubTab, setListingSubTab] = useState<ListingSubTab>("titles");

  // Search Input State
  const [searchQuery, setSearchQuery] = useState("");
  const [showManualUrls, setShowManualUrls] = useState(false);
  const [manualUrls, setManualUrls] = useState(["", "", ""]);
  const [manualPrices, setManualPrices] = useState(["", "", ""]);
  const [manualListings, setManualListings] = useState<(ListingDownloaderData | null)[]>([null, null, null]);
  const [fetchingUrlIndex, setFetchingUrlIndex] = useState<number | null>(null);

  // Listing Downloader State
  const [isDownloaderOpen, setIsDownloaderOpen] = useState(false);
  const [downloaderInitialData, setDownloaderInitialData] = useState<ListingDownloaderData | null>(null);

  // Product Facts State (Starts clean and unpolluted; no hardcoded state)
  const [productFacts, setProductFacts] = useState<Partial<ProductFacts>>({});
  const [sessionAnalysisId, setSessionAnalysisId] = useState<string | null>(null);

  // Drawers
  const [isFactsDrawerOpen, setIsFactsDrawerOpen] = useState(false);
  const [isDataDetailsOpen, setIsDataDetailsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [isDeviceManagerOpen, setIsDeviceManagerOpen] = useState(false);

  // Loading & Results
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [apiNotice, setApiNotice] = useState<{ type?: "info" | "warning" | "error" | string; message: string } | string | null>(null);

  // Editable Workspace State
  const [editedTitle, setEditedTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [tagInputError, setTagInputError] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [photoChecks, setPhotoChecks] = useState<{ [key: number]: boolean }>({});

  // Copy Feedback States
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Keywords Tab Filters
  const [kwSearch, setKwSearch] = useState("");
  const [kwSourceFilter, setKwSourceFilter] = useState<"all" | "observed" | "suggested">("all");
  const [kwSortField, setKwSortField] = useState<"relevance" | "presence">("presence");
  const [kwSortAsc, setKwSortAsc] = useState(false);

  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedCount(getSavedListings().length);
  }, []);

  // Smoothly keep active content tab in view on mobile
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const activeBtn = tabsContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  const triggerCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Ref to hold handleAnalyze so hash/extension listeners can invoke it without circular dependencies
  const handleAnalyzeRef = useRef<any>(null);

  // 1-Click Copy complete listing package (Title, 13 Tags, Description, Care, FAQs)
  const handleCopyCompletePackage = () => {
    const titleText = editedTitle || results?.title?.text || "";
    const tagsArr = (editedTags.length > 0 ? editedTags : (results?.tags?.list || [])).filter(Boolean);
    const tagsText = tagsArr.join(", ");
    const descText = editedDescription || results?.description?.fullDescription || "";
    const careText = results?.description?.careInstructions || "";
    const faqs = results?.faqs || [];
    const faqsText = faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

    const packageText = [
      "========================================",
      "ETSY LISTING TITLE (Max 140 Chars)",
      "========================================",
      titleText,
      "",
      "========================================",
      `13 ETSY TAGS (${tagsArr.length} Tags, <= 20 Chars Each)`,
      "========================================",
      tagsText,
      "",
      "========================================",
      "LISTING DESCRIPTION",
      "========================================",
      descText,
      careText ? `\n\n--- CARE INSTRUCTIONS ---\n${careText}` : "",
      faqsText ? `\n\n--- BUYER FAQS ---\n${faqsText}` : "",
      "",
      "========================================",
      "ETSY LISTING PACKAGE COMPILED BY ETSY INTELLIGENCE",
      "========================================",
    ].filter(Boolean).join("\n");

    triggerCopy("complete-package", packageText);
  };

  // Reset all state for clean isolated session
  const handleResetSession = () => {
    setResults(null);
    setSearchQuery("");
    setErrorMsg("");
    setApiNotice(null);
    setShowManualUrls(false);
    setManualUrls(["", "", ""]);
    setManualPrices(["", "", ""]);
    setManualListings([null, null, null]);
    setFetchingUrlIndex(null);
    setEditedTitle("");
    setEditedTags([]);
    setEditedDescription("");
    setPhotoChecks({});
    setProductFacts({});
    setSessionAnalysisId(null);
    setIsFactsDrawerOpen(false);
    setIsDataDetailsOpen(false);
    setIsDownloaderOpen(false);
    setDownloaderInitialData(null);
  };

  // Open Downloader Modal for any listing
  const handleOpenDownloader = (data?: ListingDownloaderData | null) => {
    setDownloaderInitialData(data || null);
    setIsDownloaderOpen(true);
  };

  // Handle incoming 1-click Bookmarklet & Extension import via #import=...
  useEffect(() => {
    const handleCheckImport = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      if (hash && hash.startsWith("#import=")) {
        try {
          const raw = decodeURIComponent(hash.replace("#import=", ""));
          const data = JSON.parse(raw);

          // Case 0: Analyze Competitors directly from Extension Queue
          if (
            data &&
            (data.action === "analyze_competitors" ||
              data.type === "analyze_competitors" ||
              (data.action === "open_competitors_in_studio" && Array.isArray(data.competitors)))
          ) {
            const list: any[] = data.competitors || [];
            if (list.length > 0) {
              const comps = list.slice(0, 3);
              const urls = comps.map((c: any) => c.url || (c.listingId ? `https://www.etsy.com/listing/${c.listingId}` : ""));
              const prices = comps.map((c: any) => (c.price !== undefined && c.price !== null ? String(c.price) : ""));
              const structuredListings: (ListingDownloaderData | null)[] = comps.map((c: any) => ({
                listingId: c.listingId,
                title: c.title,
                price: c.price,
                currency: c.currency || "USD",
                shopName: c.shopName,
                url: c.url || (c.listingId ? `https://www.etsy.com/listing/${c.listingId}` : ""),
                imageUrl: c.imageUrl,
                images: c.images || (c.imageUrl ? [c.imageUrl] : []),
                tags: c.tags || [],
                description: c.description || "",
                source: "etsy_extension_competitors",
              }));

              while (structuredListings.length < 3) structuredListings.push(null);
              while (urls.length < 3) urls.push("");
              while (prices.length < 3) prices.push("");

              let query = (data.keyword || "").trim();
              if (!query && comps[0]) {
                if (comps[0].tags && comps[0].tags.length > 0) {
                  query = comps[0].tags[0];
                } else if (comps[0].title) {
                  query = comps[0].title.split(/[,|\-]/)[0].trim();
                }
              }

              setSearchQuery(query);
              setManualListings(structuredListings);
              setManualUrls(urls);
              setManualPrices(prices);
              setShowManualUrls(true);

              setApiNotice({
                type: "info",
                message: `✓ Ingested ${comps.length} saved competitor listing(s)! Analyzing competitor titles, tags, and pricing with Groq AI...`,
              });

              window.history.replaceState(null, "", window.location.pathname + window.location.search);

              if (handleAnalyzeRef.current) {
                handleAnalyzeRef.current(undefined, query, structuredListings, urls, prices);
              }
              return;
            }
          }

          // Case 1: Bulk Competitors from Search or Shop Page
          if (
            data &&
            (data.type === "competitors" ||
              Array.isArray(data.competitors) ||
              (Array.isArray(data) && data[0]?.source === "etsy_search_bulk"))
          ) {
            const list: any[] = data.competitors || (Array.isArray(data) ? data : []);
            if (list.length > 0) {
              if (data.keyword) {
                setSearchQuery(data.keyword);
              }
              setShowManualUrls(true);

              const urls = list.slice(0, 5).map((c: any) => c.url || `https://www.etsy.com/listing/${c.listingId}`);
              const prices = list.slice(0, 5).map((c: any) => c.price || "");
              const listings = list.slice(0, 5).map((c: any) => ({
                listingId: c.listingId,
                title: c.title,
                price: c.price,
                currency: c.currency || "USD",
                shopName: c.shopName,
                url: c.url,
                imageUrl: c.imageUrl,
                images: c.images || (c.imageUrl ? [c.imageUrl] : []),
                tags: c.tags || [],
                description: c.description || "",
                source: "etsy_extension_bulk",
              }));

              setManualUrls(urls);
              setManualPrices(prices);
              setManualListings(listings);
              setApiNotice({
                type: "info",
                message: `✓ Successfully loaded ${list.length} competitor listings from Etsy Extension! Click "Run Market Analysis" to analyze their SEO & pricing.`,
              });

              window.history.replaceState(null, "", window.location.pathname + window.location.search);
              return;
            }
          }

          // Case 2: Add As Competitor directly from Extension
          if (data && (data.action === "add_competitor" || data.type === "add_competitor")) {
            const competitorListing: ListingDownloaderData = {
              listingId: data.listingId,
              title: data.title,
              price: data.price,
              currency: data.currency || "USD",
              shopName: data.shopName,
              url: data.url || (data.listingId ? `https://www.etsy.com/listing/${data.listingId}` : ""),
              imageUrl: data.imageUrl,
              images: data.images || (data.imageUrl ? [data.imageUrl] : []),
              tags: data.tags || [],
              description: data.description || "",
              source: "etsy_extension_single",
            };

            const result = handleToggleCompetitor(competitorListing);
            setShowManualUrls(true);

            if (result.action === "added") {
              setApiNotice({
                type: "info",
                message: `✓ Added "${(data.title || "listing").slice(0, 32)}..." as Competitor #${(result.slot ?? 0) + 1} of 3! Click "Run Market Analysis" to analyze competitor patterns.`,
              });
            } else if (result.action === "removed") {
              setApiNotice({
                type: "info",
                message: `Removed "${(data.title || "listing").slice(0, 32)}..." from Competitor Slot #${(result.slot ?? 0) + 1}.`,
              });
            } else {
              setApiNotice({
                type: "warning",
                message: `All 3 competitor slots are filled! Clear a slot in the competitor benchmarking section below to add this listing.`,
              });
            }

            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            return;
          }

          // Case 3: Single Listing import
          if (data && (data.listingId || data.title || data.url)) {
            handleOpenDownloader(data);
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        } catch (e) {
          console.error("Failed to parse bookmarklet/extension import data", e);
        }
      }
    };

    handleCheckImport();
    window.addEventListener("hashchange", handleCheckImport);
    return () => window.removeEventListener("hashchange", handleCheckImport);
  }, []);

  // Toggle or add a listing to the 3 competitor slots
  const handleToggleCompetitor = (targetListing: ListingDownloaderData) => {
    // 1. Check if already present in competitor slots
    const existingIdx = manualListings.findIndex(
      (item, i) =>
        (item?.listingId && targetListing.listingId && String(item.listingId) === String(targetListing.listingId)) ||
        (item?.url && targetListing.url && item.url === targetListing.url) ||
        (manualUrls[i] && targetListing.url && manualUrls[i].includes(targetListing.url))
    );

    if (existingIdx !== -1) {
      // Remove from competitors
      setManualListings((prev) => {
        const copy = [...prev];
        copy[existingIdx] = null;
        return copy;
      });
      setManualUrls((prev) => {
        const copy = [...prev];
        copy[existingIdx] = "";
        return copy;
      });
      setManualPrices((prev) => {
        const copy = [...prev];
        copy[existingIdx] = "";
        return copy;
      });
      return { success: true, action: "removed" as const, slot: existingIdx };
    }

    // 2. Find first empty slot (max 3)
    const emptyIdx = manualListings.findIndex((item, i) => !item && !manualUrls[i]);
    if (emptyIdx === -1) {
      // All 3 slots are full
      return { success: false, action: "full" as const };
    }

    // 3. Add to competitor slot
    const targetUrl = targetListing.url || (targetListing.listingId ? `https://www.etsy.com/listing/${targetListing.listingId}` : "");
    const targetPrice = targetListing.price || "";

    setManualListings((prev) => {
      const copy = [...prev];
      copy[emptyIdx] = targetListing;
      return copy;
    });
    setManualUrls((prev) => {
      const copy = [...prev];
      copy[emptyIdx] = targetUrl;
      return copy;
    });
    if (targetPrice) {
      setManualPrices((prev) => {
        const copy = [...prev];
        copy[emptyIdx] = targetPrice;
        return copy;
      });
    }
    setShowManualUrls(true);

    return { success: true, action: "added" as const, slot: emptyIdx };
  };

  // Automatically fetch listing images, tags, price, and details when URL is entered
  const handleAutoFetchCompetitorUrl = async (idx: number, rawUrl: string) => {
    const cleanUrl = rawUrl.trim();
    if (!cleanUrl || (!cleanUrl.includes("etsy.com/listing/") && !/^\d{8,12}$/.test(cleanUrl))) {
      return;
    }

    setFetchingUrlIndex(idx);
    try {
      let userApiKey = "";
      try {
        userApiKey = localStorage.getItem("etsy_user_api_key") || "";
      } catch {}

      const res = await fetch("/api/fetch-listing-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userApiKey ? { "x-etsy-api-key": userApiKey } : {}),
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await res.json();
      if (data.success && data.listing) {
        const fetched: ListingDownloaderData = {
          listingId: data.listing.listingId,
          title: data.listing.title,
          description: data.listing.description,
          price: data.listing.price,
          currency: data.listing.currency,
          shopName: data.listing.shopName,
          url: data.listing.url,
          images: data.listing.images,
          imageUrl: data.listing.imageUrl,
          tags: data.listing.tags,
          materials: data.listing.materials,
          source: data.listing.source,
        };

        setManualListings((prev) => {
          const copy = [...prev];
          copy[idx] = fetched;
          return copy;
        });

        // Auto-fill price if available and manual input is empty
        if (data.listing.price && !manualPrices[idx]) {
          setManualPrices((prev) => {
            const copy = [...prev];
            copy[idx] = data.listing.price;
            return copy;
          });
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setFetchingUrlIndex((curr) => (curr === idx ? null : curr));
    }
  };

  // Map activeTab to header NavItem
  const activeNav: NavItem = useMemo(() => {
    if (!results) return "research";
    if (activeTab === "overview") return "research";
    if (activeTab === "keywords") return "keywords";
    if (activeTab === "competitors") return "competitors";
    if (activeTab === "listing") return "listing";
    if (activeTab === "pricing") return "pricing";
    return "research";
  }, [results, activeTab]);

  const handleSelectNav = (item: NavItem) => {
    if (item === "research") {
      if (!results) {
        setAppMode("research");
      } else {
        setActiveTab("overview");
      }
    } else {
      setActiveTab(item as MainTab);
    }
  };

  const handleNewAnalysis = () => {
    handleResetSession();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Run Market Analysis / Optimization with 1-click execution & clean session isolation
  const handleAnalyze = async (
    e?: React.FormEvent,
    overrideQuery?: string,
    overrideManualListings?: (ListingDownloaderData | null)[],
    overrideManualUrls?: string[],
    overrideManualPrices?: string[]
  ) => {
    if (e) e.preventDefault();
    const cleanQuery = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    if (!cleanQuery) return;

    const currentListings = overrideManualListings !== undefined ? overrideManualListings : manualListings;
    const currentUrls = overrideManualUrls !== undefined ? overrideManualUrls : manualUrls;
    const currentPrices = overrideManualPrices !== undefined ? overrideManualPrices : manualPrices;

    setIsLoading(true);
    setErrorMsg("");
    setApiNotice(null);

    // Clear previous results to guarantee zero cross-analysis state leakage
    setResults(null);
    const newSessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionAnalysisId(newSessionId);

    // Reset previous product facts if running research mode to avoid any cross-product contamination
    if (appMode === "research") {
      setProductFacts({});
    }

    try {
      let fetchedCompetitorListings: any[] = [];
      const validManualUrls = currentUrls.filter((u) => u.trim().length > 0);

      // Attempt background competitor retrieval if no manual URLs were explicitly provided
      if (validManualUrls.length === 0) {
        try {
          const autoRes = await fetch("/api/auto-fetch-competitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword: cleanQuery, limit: 25 }),
          });
          const autoData = await autoRes.json();

          if (autoData.success && Array.isArray(autoData.data?.competitors) && autoData.data.competitors.length > 0) {
            fetchedCompetitorListings = autoData.data.competitors;
          }
        } catch {
          // Graceful fallback to 0 listings; quick-optimize processes cleanly without blocking
        }
      }

      // Convert manual listings into structured competitors with full images and metadata
      const manualCompetitorListings: any[] = [];
      currentUrls.forEach((u, idx) => {
        if (u.trim().length > 0) {
          const l = currentListings[idx];
          manualCompetitorListings.push({
            listingId: l?.listingId,
            title: l?.title || `Competitor Listing #${idx + 1}`,
            url: u.trim(),
            price: currentPrices[idx] || l?.price || "0.00",
            currency: l?.currency || "USD",
            shopName: l?.shopName || `Shop #${idx + 1}`,
            imageUrl: l?.imageUrl,
            images: l?.images,
            videos: l?.videos,
            videoUrl: l?.videoUrl,
            tags: l?.tags || [],
            description: l?.description,
          });
        }
      });

      const combinedCompetitorListings = [
        ...fetchedCompetitorListings,
        ...manualCompetitorListings,
      ];

      // Retrieve optional custom Groq API key from localStorage
      let storedGroqKey = "";
      try {
        storedGroqKey = localStorage.getItem("groq_api_key") || "";
      } catch {}

      // Call quick-optimize engine with strict provenance and session isolation
      const res = await fetch("/api/quick-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: appMode,
          queryOrUrl: cleanQuery,
          productFacts: appMode === "optimize" ? productFacts : undefined,
          competitorListings: combinedCompetitorListings.length > 0 ? combinedCompetitorListings : undefined,
          competitorUrls: validManualUrls.length > 0 ? validManualUrls : undefined,
          manualPrices: currentPrices.filter(Boolean),
          groqApiKey: storedGroqKey || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Analysis could not be completed.");
      }

      setResults(data);
      setEditedTitle(data.title?.text || "");
      setEditedTags(data.tags?.list || []);
      setEditedDescription(data.description?.fullDescription || "");
      setActiveTab("overview");
      setPhotoChecks({});
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze market. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleAnalyzeRef.current = handleAnalyze;
  });

  // Apply Preset & Auto-Analyze for 1-click exploration
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    handleResetSession();
    setSearchQuery(preset.query);
    handleAnalyze(undefined, preset.query);
  };

  // Tag editing functions
  const handleRemoveTag = (indexToRemove: number) => {
    setEditedTags((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (!clean) return;
    if (clean.length > 20) {
      setTagInputError("Etsy tags must be 20 characters or fewer.");
      return;
    }
    if (editedTags.includes(clean)) {
      setTagInputError("Tag already in list.");
      return;
    }
    if (editedTags.length >= 13) {
      setTagInputError("Maximum 13 Etsy tags reached.");
      return;
    }
    setEditedTags((prev) => [...prev, clean]);
    setNewTagInput("");
    setTagInputError("");
  };

  // Save to history
  const handleSaveToHistory = () => {
    if (!results) return;
    saveListingToHistory({
      mainBroadPhrase: results.mainBroadPhrase || searchQuery,
      productNoun: results.productNoun || "Product",
      title: editedTitle || results.title?.text || "",
      category: results.category || "Handmade Products",
      tags: editedTags,
      description: editedDescription,
      urls: {
        u1: manualUrls[0] || "",
        u2: manualUrls[1] || "",
        u3: manualUrls[2] || "",
      },
      prices: {
        p1: manualPrices[0],
        p2: manualPrices[1],
        p3: manualPrices[2],
      },
    });
    setSavedCount(getSavedListings().length);
    triggerCopy("save", "saved");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!results) return;
    const rows = [
      ["Type", "Content"],
      ["Primary Keyword", results.mainBroadPhrase || searchQuery],
      ["Title", `"${(editedTitle || results.title?.text || "").replace(/"/g, '""')}"`],
      ["Tags (13)", `"${editedTags.join(", ")}"`],
      ["Description", `"${(editedDescription || "").replace(/"/g, '""')}"`],
      ["Care Instructions", `"${(results.description?.careInstructions || "").replace(/"/g, '""')}"`],
      ["Readiness Summary", results.readinessReport?.summary || "N/A"],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `etsy-listing-${(results.mainBroadPhrase || "export").replace(/\s+/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Sorted Keywords (Factual, no fake demand/competition columns)
  const processedKeywords = useMemo(() => {
    if (!results?.topKeywords) return [];
    let list = [...results.topKeywords];

    if (kwSearch.trim()) {
      const q = kwSearch.toLowerCase();
      list = list.filter((k) => k.keyword?.toLowerCase().includes(q));
    }

    if (kwSourceFilter === "observed") {
      list = list.filter((k) => k.source === "observed");
    } else if (kwSourceFilter === "suggested") {
      list = list.filter((k) => k.source === "suggested");
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (kwSortField === "presence") {
        valA = a.competitorCount || 0;
        valB = b.competitorCount || 0;
      } else if (kwSortField === "relevance") {
        valA = a.relevanceScore || 0;
        valB = b.relevanceScore || 0;
      }
      return kwSortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [results, kwSearch, kwSourceFilter, kwSortField, kwSortAsc]);

  // Research Coverage Factual Counts
  const researchCoverage = useMemo(() => {
    const compCount = results?.competitorsAnalyzed?.length || 0;
    const priceCount = results?.priceQuartiles?.sampleSize || 0;
    const kwCount = results?.topKeywords?.length || 0;
    const factsCount = Object.keys(productFacts).length;

    return {
      competitors: {
        count: compCount,
        status: compCount >= 5 ? "Sufficient" : compCount > 0 ? "Limited sample" : "Unavailable",
        color: compCount >= 5 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-600 bg-slate-100 border-slate-200",
      },
      pricing: {
        count: priceCount,
        status: priceCount >= 5 ? "Sufficient" : "Insufficient (< 5)",
        color: priceCount >= 5 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200",
      },
      keywords: {
        count: kwCount,
        status: kwCount > 0 ? `${kwCount} candidates` : "None",
        color: kwCount > 0 ? "text-blue-700 bg-blue-50 border-blue-200" : "text-slate-600 bg-slate-100 border-slate-200",
      },
      facts: {
        count: factsCount,
        status: factsCount >= 3 ? `${factsCount} confirmed` : "Default / Inferred",
        color: factsCount >= 3 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-600 bg-slate-100 border-slate-200",
      },
    };
  }, [results, productFacts]);

  return (
    <AccessGate>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden w-full">
        {/* Premium Floating Glass Header */}
        <Header
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          onNewAnalysis={handleNewAnalysis}
          onOpenHistory={() => setIsHistoryOpen(true)}
          savedCount={savedCount}
          onOpenFacts={() => setIsFactsDrawerOpen(true)}
          onOpenDownloader={() => handleOpenDownloader(null)}
          onOpenDeviceManager={() => setIsDeviceManagerOpen(true)}
        />

        {/* Main Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-8 space-y-6">
          {/* SEARCH WORKSPACE: Shown when no results */}
          {!results && (
            <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-8">
              <div className="text-center space-y-3">
                {/* Segmented Mode Selector */}
                <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAppMode("research")}
                    className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                      appMode === "research"
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Market Research
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppMode("optimize")}
                    className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                      appMode === "optimize"
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Listing Optimization
                  </button>
                </div>

                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {appMode === "research"
                    ? "Etsy Market & Competitor Research"
                    : "Listing Optimization & Search Grounding"}
                </h1>
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {appMode === "research"
                    ? "Inspect real competitor listings, market price quartiles, and tag overlap without assuming your product features."
                    : "Combine confirmed product facts with live competitor patterns to generate compliant titles, 13 tags, and pricing plans."}
                </p>
              </div>

              {/* Main Search Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                <form onSubmit={handleAnalyze} className="space-y-4">
                  {/* Primary Product Query */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                        Target Search Keyword or Product Niche
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenDownloader(null)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer transition"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Listing Downloader</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g. ceramic matcha bowl, leather wallet, digital planner..."
                        className="w-full h-11 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Etsy URL Detected Banner */}
                  {searchQuery.includes("etsy.com/listing/") && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Etsy Listing Link detected in search.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDownloader({ url: searchQuery })}
                        className="px-3 py-1 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-xs border border-black"
                      >
                        <Download className="w-3 h-3 text-white" />
                        <span>Open in Downloader</span>
                      </button>
                    </div>
                  )}

                  {/* Optional Competitor Benchmarking URLs (Progressive Disclosure) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualUrls(!showManualUrls)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="text-slate-400 font-mono text-sm leading-none">{showManualUrls ? "−" : "+"}</span>
                      <span>Add competitor URLs to benchmark (optional)</span>
                    </button>

                    {showManualUrls && (
                      <div className="space-y-2.5 pt-3 mt-2 border-t border-slate-100">
                        <p className="text-[11px] text-slate-500">
                          Paste up to 3 live Etsy listing URLs to automatically retrieve images, pricing, and tags:
                        </p>
                        {[0, 1, 2].map((idx) => {
                          const listing = manualListings[idx];
                          const isFetchingThis = fetchingUrlIndex === idx;

                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex gap-2 items-center">
                                <div className="relative flex-1">
                                  <input
                                    type="url"
                                    value={manualUrls[idx]}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const copy = [...manualUrls];
                                      copy[idx] = val;
                                      setManualUrls(copy);
                                      if (val.includes("etsy.com/listing/") || /^\d{8,12}$/.test(val.trim())) {
                                        handleAutoFetchCompetitorUrl(idx, val);
                                      }
                                    }}
                                    onBlur={() => {
                                      if (manualUrls[idx] && !manualListings[idx]) {
                                        handleAutoFetchCompetitorUrl(idx, manualUrls[idx]);
                                      }
                                    }}
                                    placeholder={`Competitor #${idx + 1} Etsy URL (e.g. https://www.etsy.com/listing/...)`}
                                    className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-3 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 outline-none transition"
                                  />
                                  {isFetchingThis && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                    </div>
                                  )}
                                </div>

                                <div className="relative w-24 shrink-0">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">$</span>
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={manualPrices[idx]}
                                    onChange={(e) => {
                                      const copy = [...manualPrices];
                                      copy[idx] = e.target.value;
                                      setManualPrices(copy);
                                    }}
                                    placeholder="Price"
                                    className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-6 pr-2 text-xs font-mono text-slate-900 focus:border-slate-900 outline-none"
                                  />
                                </div>
                              </div>

                              {/* Auto-fetched Preview Pill / Card */}
                              {listing && (
                                <div className="p-2 bg-slate-50 border border-slate-200/90 rounded-lg flex items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="w-8 h-8 rounded-md bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                      {listing.imageUrl ? (
                                        <img
                                          src={listing.imageUrl}
                                          alt={listing.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Store className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="overflow-hidden">
                                      <span className="font-semibold text-slate-900 truncate block text-[11px]">
                                        {listing.title || `Listing #${idx + 1}`}
                                      </span>
                                      <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                        <span>{listing.shopName || "Etsy Shop"}</span>
                                        {listing.price && <span className="font-mono text-emerald-700 font-semibold">${listing.price}</span>}
                                        {listing.tags && listing.tags.length > 0 && <span>• {listing.tags.length} tags</span>}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDownloader(listing)}
                                      className="h-6 px-2 bg-black hover:bg-zinc-800 text-white rounded text-[10px] font-semibold inline-flex items-center gap-1 transition shadow-2xs cursor-pointer border border-black"
                                      title="Download high-res photos and copy tags"
                                    >
                                      <Download className="w-3 h-3 text-white" />
                                      <span>Downloader</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {apiNotice && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                        (typeof apiNotice === "object" ? apiNotice.type : "") === "info"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : (typeof apiNotice === "object" ? apiNotice.type : "") === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      {(typeof apiNotice === "object" ? apiNotice.type : "") === "info" ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span>{typeof apiNotice === "object" ? apiNotice.message : apiNotice}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="font-heading w-full h-11 bg-black hover:bg-zinc-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-black"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Gathering marketplace evidence...</span>
                      </>
                    ) : (
                      <>
                        <span>{appMode === "research" ? "Analyze Market" : "Optimize Listing"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Clean Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-center">
                  Select a category example
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 bg-white border border-slate-200 rounded-lg text-left hover:border-slate-400 transition shadow-2xs group cursor-pointer"
                    >
                      <div className="font-heading font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYSIS RESULTS WORKSPACE */}
          {results && (
            <div className="space-y-6">
              {/* Project Header Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 tracking-tight capitalize">
                      {results.mainBroadPhrase || searchQuery}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {results.category || "Handmade Products"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {results.mode === "research" ? "Mode A: Market Research" : "Mode B: Listing Optimization"}
                    </span>
                  </div>

                  {/* Factual Research Status */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="font-mono font-medium text-slate-700">
                      {results.competitorsAnalyzed?.length || 0} listings retrieved
                    </span>
                    <span>•</span>
                    <span>{results.topKeywords?.length || 0} keywords found</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setIsDataDetailsOpen(true)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 ml-1 cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Data sources</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFactsDrawerOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Product Facts</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className="px-3.5 py-2 bg-black hover:bg-zinc-800 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer border border-black"
                  >
                    {copiedKey === "save" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save analysis</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Permanent Results Navigation */}
              <div className="w-full max-w-full overflow-hidden border-b border-slate-200">
                <div
                  ref={tabsContainerRef}
                  className="flex items-center gap-4 sm:gap-5 overflow-x-auto whitespace-nowrap px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "keywords", label: "Keywords" },
                    { id: "competitors", label: "Competitors" },
                    { id: "listing", label: "Listing" },
                    { id: "pricing", label: "Pricing" },
                    { id: "photos", label: "Photos & Media" },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        data-active={isActive ? "true" : "false"}
                        onClick={() => setActiveTab(tab.id as MainTab)}
                        className={`py-3 px-1 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? "border-emerald-600 text-emerald-700 font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* HERO: SYNTHESIZED READY-TO-USE LISTING PACKAGE */}
                  <div className="bg-gradient-to-b from-white to-slate-50 border-2 border-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-black text-white">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Groq AI Final Listing</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ 100% Etsy Compliant
                          </span>
                          {results.competitorsAnalyzed?.length > 0 && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              Benchmarked vs {results.competitorsAnalyzed.length} Competitors
                            </span>
                          )}
                        </div>
                        <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 mt-1">
                          Your SEO-Optimized Final Listing
                        </h2>
                        <p className="text-xs text-slate-600">
                          Complete, high-converting listing package synthesized from live competitor benchmark data. Ready for your shop.
                        </p>
                      </div>

                      {/* 1-Click Copy Complete Package */}
                      <button
                        type="button"
                        onClick={handleCopyCompletePackage}
                        className="px-4 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition shrink-0 cursor-pointer border border-black"
                      >
                        {copiedKey === "complete-package" ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300">✓ Complete Package Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>📋 Copy Complete Listing Package</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Competitive Summary Strategy Callout */}
                    {results.competitiveSummary && (
                      <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-start gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                          🎯
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                            Competitive Advantage & Algorithmic Strategy
                          </span>
                          <p className="text-slate-200 leading-relaxed text-xs">
                            {results.competitiveSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick Preview Grid: Title & 13 Tags Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Title Preview */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Optimized Title
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500">
                              {(editedTitle || results.title?.text || "").length} / 140 chars
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("hero-title", editedTitle || results.title?.text || "")}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy title"
                            >
                              {copiedKey === "hero-title" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                          {editedTitle || results.title?.text || "Optimized Etsy Title"}
                        </p>
                      </div>

                      {/* 13 Tags Preview */}
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            13 Curated Tags (All ≤ 20 Chars)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-700 font-bold">
                              {(editedTags.length > 0 ? editedTags : (results.tags?.list || [])).length} / 13 Tags
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("hero-tags", (editedTags.length > 0 ? editedTags : (results.tags?.list || [])).join(", "))}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy tags"
                            >
                              {copiedKey === "hero-tags" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
                          {(editedTags.length > 0 ? editedTags : (results.tags?.list || [])).map((t: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* View/Edit in Workspace Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
                      <span className="italic">
                        Want to tweak phrasing or review the complete description & FAQs?
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("listing")}
                        className="font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Full Listing Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Factual Research Coverage Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Research Coverage Status
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsDataDetailsOpen(true)}
                        className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3 h-3" />
                        <span>Data sources</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Competitors</span>
                        <div className="font-heading font-bold text-slate-900">
                          {results.competitorsAnalyzed?.length || 0} listings
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${researchCoverage.competitors.color}`}>
                          {researchCoverage.competitors.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Pricing Benchmarks</span>
                        <div className="font-heading font-bold text-slate-900">
                          {results.priceQuartiles?.sampleSize || 0} valid prices
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${researchCoverage.pricing.color}`}>
                          {researchCoverage.pricing.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Keyword Pool</span>
                        <div className="font-heading font-bold text-slate-900">
                          {results.topKeywords?.length || 0} candidates
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-200">
                          Available
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-500 block text-[11px]">Product Facts</span>
                        <div className="font-heading font-bold text-slate-900">
                          {Object.keys(productFacts).length} fields provided
                        </div>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${researchCoverage.facts.color}`}>
                          {researchCoverage.facts.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 12-Point 3-State Listing Readiness Audit */}
                  {results.readinessReport && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                              Listing Readiness Audit
                            </h2>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                results.readinessReport.overallStatus === "ready"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : results.readinessReport.overallStatus === "needs_attention"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {results.readinessReport.summary}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Deterministic checks evaluating search compliance, completeness, and market alignment.
                          </p>
                        </div>
                      </div>

                      {/* 3-State Checklist Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {results.readinessReport.checks.map((check: any) => (
                          <div
                            key={check.id}
                            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition ${
                              check.status === "complete"
                                ? "bg-slate-50/50 border-slate-200 text-slate-800"
                                : check.status === "cannot_evaluate"
                                ? "bg-slate-100/70 border-slate-200 text-slate-600"
                                : "bg-amber-50/40 border-amber-200 text-amber-900"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {check.status === "complete" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : check.status === "cannot_evaluate" ? (
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                              )}
                            </div>
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold block">{check.label}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded capitalize ${
                                  check.status === "complete"
                                    ? "text-emerald-700 bg-emerald-50"
                                    : check.status === "cannot_evaluate"
                                    ? "text-slate-500 bg-slate-200"
                                    : "text-amber-700 bg-amber-100"
                                }`}>
                                  {check.status.replace("_", " ")}
                                </span>
                              </div>
                              {check.recommendation && (
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  {check.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Title */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Recommended Title
                        </h2>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Optimized for Etsy search
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-medium ${
                          editedTitle.length > 140 ? "text-rose-600 font-bold" : "text-slate-500"
                        }`}>
                          {editedTitle.length} / 140
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerCopy("title", editedTitle)}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          title="Copy title"
                        >
                          {copiedKey === "title" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isEditingTitle ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingTitle(false)}
                          className="px-3 py-1 bg-black hover:bg-zinc-800 text-white text-xs font-medium rounded-md cursor-pointer border border-black"
                        >
                          Done editing
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingTitle(true)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium cursor-pointer hover:border-slate-400 transition"
                      >
                        {editedTitle}
                      </div>
                    )}
                  </div>

                  {/* 13 Recommended Tags as Interactive Chips */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          13 Etsy Tags
                        </h2>
                        <p className="text-xs text-slate-500">
                          Click × to remove or type below to customize.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono font-semibold ${
                          editedTags.length === 13 ? "text-emerald-700" : "text-amber-700"
                        }`}>
                          {editedTags.length} / 13 used ({13 - editedTags.length} remaining)
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerCopy("tags", editedTags.join(", "))}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedKey === "tags" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy all tags</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Tag Chips */}
                    <div className="flex flex-wrap gap-2">
                      {editedTags.map((tag, idx) => {
                        const isNearLimit = tag.length >= 19;
                        return (
                          <div
                            key={idx}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                              isNearLimit
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <span>{tag}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({tag.length}/20)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(idx)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Tag Input */}
                    {editedTags.length < 13 && (
                      <form onSubmit={handleAddTag} className="flex gap-2 items-center pt-2">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          maxLength={20}
                          placeholder="Add custom tag (max 20 chars)..."
                          className="w-64 h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:border-slate-900 outline-none"
                        />
                        <button
                          type="submit"
                          className="h-9 px-3 bg-black text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition cursor-pointer border border-black"
                        >
                          Add tag
                        </button>
                        {tagInputError && (
                          <span className="text-xs text-rose-600">{tagInputError}</span>
                        )}
                      </form>
                    )}
                  </div>

                  {/* 3 Important Actions */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      3 Recommended Next Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">1. Front-Load Physical Traits</span>
                        <p className="text-xs text-slate-300">
                          Lead with the exact product noun and primary material within the first 45 characters.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">2. Fill All 13 Tag Slots</span>
                        <p className="text-xs text-slate-300">
                          Ensure all 13 slots use diverse 2–3 word phrases under 20 characters to capture long-tail searches.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
                        <span className="text-xs font-bold text-emerald-400 block">3. Benchmark Production Costs</span>
                        <p className="text-xs text-slate-300">
                          Enter your material costs in the Pricing tab to compute your true take-home payout after Etsy commission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KEYWORDS (Factual, Observed vs Suggested) */}
              {activeTab === "keywords" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Keyword Research
                      </h2>
                      <p className="text-xs text-slate-500">
                        Distinguishing phrases observed directly in competing listings from AI semantic expansions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={kwSearch}
                          onChange={(e) => setKwSearch(e.target.value)}
                          placeholder="Filter keywords..."
                          className="h-8 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-slate-900"
                        />
                      </div>

                      <select
                        value={kwSourceFilter}
                        onChange={(e: any) => setKwSourceFilter(e.target.value)}
                        className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
                      >
                        <option value="all">All Keywords</option>
                        <option value="observed">Observed in Competitors</option>
                        <option value="suggested">AI Suggestions</option>
                      </select>
                    </div>
                  </div>

                  {/* Factual Keywords Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="pb-3 pr-4">Keyword</th>
                          <th className="pb-3 px-3">Type</th>
                          <th className="pb-3 px-3 cursor-pointer" onClick={() => { setKwSortField("presence"); setKwSortAsc(!kwSortAsc); }}>
                            Market Presence {kwSortField === "presence" ? (kwSortAsc ? "↑" : "↓") : ""}
                          </th>
                          <th className="pb-3 px-3">In Titles</th>
                          <th className="pb-3 px-3">In Tags</th>
                          <th className="pb-3 px-3 cursor-pointer" onClick={() => { setKwSortField("relevance"); setKwSortAsc(!kwSortAsc); }}>
                            Relevance {kwSortField === "relevance" ? (kwSortAsc ? "↑" : "↓") : ""}
                          </th>
                          <th className="pb-3 pl-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {processedKeywords.map((kw: any, idx: number) => {
                          const isUsedInTags = editedTags.includes(kw.keyword?.toLowerCase());
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="py-3 pr-4 font-semibold text-slate-900">
                                {kw.keyword}
                              </td>
                              <td className="py-3 px-3">
                                {kw.source === "observed" ? (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Observed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                    Suggested
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {kw.competitorRatio || "—"}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {kw.inCompetitorTitles !== undefined ? kw.inCompetitorTitles : "—"}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {kw.inCompetitorTags !== undefined ? kw.inCompetitorTags : "—"}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                  kw.relevanceScore >= 75 ? "text-emerald-700 bg-emerald-50" : "text-slate-600 bg-slate-100"
                                }`}>
                                  {kw.relevanceScore}%
                                </span>
                              </td>
                              <td className="py-3 pl-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => triggerCopy(`kw-${idx}`, kw.keyword)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                                  title="Copy keyword"
                                >
                                  {copiedKey === `kw-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                {!isUsedInTags && editedTags.length < 13 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (kw.keyword.length <= 20 && !editedTags.includes(kw.keyword.toLowerCase())) {
                                        setEditedTags([...editedTags, kw.keyword.toLowerCase()]);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold border border-emerald-200 transition cursor-pointer"
                                  >
                                    + Tag
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: COMPETITORS (Zero Fake Listings, Honest Unavailable State) */}
              {activeTab === "competitors" && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Competitor Benchmarking
                      </h2>
                      <p className="text-xs text-slate-500">
                        Active listings observed in this product niche from official marketplace data.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDownloader(null)}
                        className="text-xs font-semibold text-white bg-black border border-black hover:bg-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-white" />
                        <span>Listing Downloader</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDataDetailsOpen(true)}
                        className="text-xs font-semibold text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Data sources</span>
                      </button>
                    </div>
                  </div>

                  {/* If NO real competitors retrieved: show clean failure state */}
                  {(!results.competitorsAnalyzed || results.competitorsAnalyzed.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">
                          Competitor data unavailable
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          We couldn&apos;t retrieve live Etsy marketplace listings for this search term. Connect an Etsy API key or add competitor listing URLs manually.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleAnalyze}
                          className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-black"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry search</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowManualUrls(true);
                            setResults(null);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Add competitor URLs manually
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Real Competitor Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {results.competitorsAnalyzed.map((comp: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition shadow-2xs"
                        >
                          <div className="space-y-2">
                            {/* Card Image with Downloader trigger */}
                            <div
                              className="group relative w-full h-36 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer"
                              onClick={() =>
                                handleOpenDownloader({
                                  listingId: comp.listingId,
                                  title: comp.title,
                                  price: comp.price,
                                  currency: comp.currency,
                                  shopName: comp.shopName,
                                  url: comp.url,
                                  imageUrl: comp.imageUrl,
                                  images: comp.images,
                                  tags: comp.tags,
                                  description: comp.description,
                                })
                              }
                            >
                              {comp.imageUrl ? (
                                <img
                                  src={comp.imageUrl}
                                  alt={comp.title}
                                  className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                                  <Store className="w-6 h-6 mb-1" />
                                  <span className="text-[10px] text-slate-500">Click to inspect / download</span>
                                </div>
                              )}
                              {comp.price && (
                                <span className="absolute bottom-2 right-2 bg-slate-900/90 text-white font-mono font-bold text-xs px-2 py-0.5 rounded">
                                  ${comp.price}
                                </span>
                              )}
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-2.5 py-1 bg-black/90 hover:bg-black text-white border border-white/20 rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                                  <Download className="w-3 h-3 text-white" />
                                  <span>Inspect & Download</span>
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                {comp.shopName || "Etsy Shop"}
                              </span>
                              <h3 className="font-semibold text-xs text-slate-900 line-clamp-2 mt-0.5">
                                {comp.title}
                              </h3>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {comp.listingId ? `ID: ${comp.listingId}` : "Competitor"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDownloader({
                                    listingId: comp.listingId,
                                    title: comp.title,
                                    price: comp.price,
                                    currency: comp.currency,
                                    shopName: comp.shopName,
                                    url: comp.url,
                                    imageUrl: comp.imageUrl,
                                    images: comp.images,
                                    tags: comp.tags,
                                    description: comp.description,
                                  })
                                }
                                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                                title="Open Listing Downloader"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </button>
                            </div>

                            {comp.url && comp.url.startsWith("http") ? (
                              <a
                                href={comp.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                              >
                                <span>Etsy</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LISTING (Titles, Description, FAQs) */}
              {activeTab === "listing" && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setListingSubTab("titles")}
                        className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                          listingSubTab === "titles"
                            ? "bg-white text-slate-900 font-semibold shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Titles
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingSubTab("description")}
                        className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                          listingSubTab === "description"
                            ? "bg-white text-slate-900 font-semibold shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Description &amp; Care
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingSubTab("faqs")}
                        className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                          listingSubTab === "faqs"
                            ? "bg-white text-slate-900 font-semibold shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Buyer FAQs
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCompletePackage}
                      className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer border border-black w-fit"
                    >
                      {copiedKey === "complete-package" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">✓ Package Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>📋 Copy Complete Listing Package</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sub-tab: Titles */}
                  {listingSubTab === "titles" && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Title Variations
                        </h2>
                        <p className="text-xs text-slate-500">
                          Objective physical traits front-loaded in the first 45 characters.
                        </p>
                      </div>

                      {/* Primary Recommended Title */}
                      <div className="p-4 rounded-lg bg-emerald-50/40 border border-emerald-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            Recommended (Search Focused)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-slate-600">
                              {editedTitle.length} / 140
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("rec-title", editedTitle)}
                              className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              {copiedKey === "rec-title" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {editedTitle}
                        </p>
                      </div>

                      {/* Alternative A & B */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Alternative A: Gifting Focused
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("alt-a", results.title?.variations?.giftFocused?.text)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy title"
                            >
                              {copiedKey === "alt-a" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {results.title?.variations?.giftFocused?.text}
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Alternative B: Craft &amp; Material
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerCopy("alt-b", results.title?.variations?.featureFocused?.text)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy title"
                            >
                              {copiedKey === "alt-b" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {results.title?.variations?.featureFocused?.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab: Description & Care */}
                  {listingSubTab === "description" && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Listing Description Workspace
                          </h2>
                          <p className="text-xs text-slate-500">
                            Edit directly below. Dedicated care guidelines are embedded to reduce post-purchase disputes.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => triggerCopy("desc", editedDescription)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                          >
                            {copiedKey === "desc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Copy description</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={16}
                        className="w-full p-4 text-xs sm:text-sm font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900 leading-relaxed transition"
                        placeholder="Listing description content..."
                      />

                      {/* Care guidelines block */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Product Care Guidelines
                          </span>
                          <button
                            type="button"
                            onClick={() => triggerCopy("care", results.description?.careInstructions)}
                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "care" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>Copy care instructions</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {results.description?.careInstructions}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab: FAQs */}
                  {listingSubTab === "faqs" && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Proactive Buyer FAQs
                          </h2>
                          <p className="text-xs text-slate-500">
                            Addresses pre-purchase hesitations regarding materials, dispatch, and sizing.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const text = (results.faqs || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
                            triggerCopy("faqs-all", text);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedKey === "faqs-all" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy all FAQs</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(results.faqs || []).map((faq: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="font-semibold text-xs text-slate-900">
                              {faq.question}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PRICING (Official 2026 Etsy Fee Schedule & Competitor Benchmarking) */}
              {activeTab === "pricing" && (
                <PricingCalculator
                  prices={
                    (results?.competitorsAnalyzed?.map((c: any) => c.price).filter(Boolean) || []).length > 0
                      ? results.competitorsAnalyzed.map((c: any) => c.price).filter(Boolean)
                      : (manualListings.map((l) => l?.price).filter(Boolean).length > 0
                          ? manualListings.map((l) => l?.price).filter(Boolean)
                          : manualPrices.filter(Boolean))
                  }
                  productNoun={results?.productNoun}
                  initialCogs={productFacts.cogs}
                  initialPrice={productFacts.targetPrice}
                />
              )}

              {/* TAB 6: PHOTOS & MEDIA (Category-Tailored Strategy) */}
              {activeTab === "photos" && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">
                            Listing Photo Strategy
                          </h2>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {results.category || "Handmade Products"} Plan
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tailored shot guidance adapted to your specific product category. Click cards to check off completed slots.
                        </p>
                      </div>

                      <span className="text-xs font-mono font-semibold text-slate-600">
                        {Object.values(photoChecks).filter(Boolean).length} / 10 completed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(results.photoStrategy || []).map((slotItem: any) => {
                        const isChecked = Boolean(photoChecks[slotItem.slot]);
                        return (
                          <div
                            key={slotItem.slot}
                            onClick={() => setPhotoChecks((prev) => ({ ...prev, [slotItem.slot]: !isChecked }))}
                            className={`p-4 rounded-lg border transition cursor-pointer flex items-start gap-3 select-none ${
                              isChecked
                                ? "bg-slate-50 border-emerald-500 text-slate-900"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition ${
                              isChecked
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>

                            <div className="space-y-0.5 flex-1">
                              <span className="text-xs font-bold text-slate-900 block">
                                {String(slotItem.slot).padStart(2, "0")} {slotItem.title}
                              </span>
                              <p className="text-xs text-slate-500 leading-snug">
                                {slotItem.guidance}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 15-Second Video Strategy */}
                  {results.videoStrategy && (
                    <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-sm font-bold tracking-tight">
                            Recommended 15-Second Video: {results.videoStrategy.title}
                          </h3>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {results.videoStrategy.durationSeconds}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {results.videoStrategy.guidance}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sleek, Modern Minimalist Footer */}
        <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-sm mt-auto pt-8 pb-28 md:pb-8 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5">
            {/* Top row: Brand + Quick Utility Shortcuts */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-black flex items-center justify-center p-1 shrink-0 border border-black/10 shadow-2xs">
                  <Image
                    src="/logo-icon.png"
                    alt="Etsy Intelligence"
                    width={20}
                    height={20}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5">
                  <span className="font-heading font-bold text-sm text-slate-900 tracking-tight">
                    Etsy Intelligence
                  </span>
                  <span className="hidden sm:inline-block text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    SEO &amp; Competitor Studio
                  </span>
                </div>
              </div>

              {/* Utility shortcuts */}
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-xs text-slate-600 font-medium">
                <button
                  type="button"
                  onClick={() => handleOpenDownloader(null)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Downloader</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFactsDrawerOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Product Facts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDataDetailsOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>Data Sources</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>History ({savedCount})</span>
                </button>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-slate-100" />

            {/* Bottom Row: Engine Status Indicator + Mandatory Etsy Disclaimer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-slate-700 font-semibold text-[11px]">Engine Active</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 text-[11px]">Deterministic Evidence Only</span>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setIsDeviceManagerOpen(true)}
                  className="text-slate-700 hover:text-black font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <span>Devices &amp; Apps</span>
                </button>
              </div>

              <p className="text-left sm:text-right max-w-xl text-[11px] text-slate-500 leading-relaxed">
                The term &apos;Etsy&apos; is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.
              </p>
            </div>
          </div>
        </footer>

        {/* Devices & Connected Apps Manager Modal */}
        <DevicesAppsModal
          isOpen={isDeviceManagerOpen}
          onClose={() => setIsDeviceManagerOpen(false)}
        />

        {/* Product Facts Drawer */}
        <ProductFactsDrawer
          isOpen={isFactsDrawerOpen}
          onClose={() => setIsFactsDrawerOpen(false)}
          facts={productFacts}
          onChange={(updated) => setProductFacts(updated)}
          onApplyAndReanalyze={handleAnalyze}
        />

        {/* Data Sources Drawer */}
        <DataDetailsDrawer
          isOpen={isDataDetailsOpen}
          onClose={() => setIsDataDetailsOpen(false)}
          sampleStats={results?.sampleStats}
          productFactsCount={Object.keys(productFacts).length}
          pricingSufficient={Boolean(results?.priceQuartiles?.isSufficient)}
        />

        {/* History Drawer */}
        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onRestore={(saved: SavedListing) => {
            handleResetSession();
            setSearchQuery(saved.mainBroadPhrase);
            setEditedTitle(saved.title);
            setEditedTags(saved.tags);
            setEditedDescription(saved.description);
            setActiveTab("overview");
            setIsHistoryOpen(false);
          }}
        />

        {/* Listing Downloader Modal */}
        <ListingDownloaderModal
          isOpen={isDownloaderOpen}
          onClose={() => setIsDownloaderOpen(false)}
          initialData={downloaderInitialData}
          competitors={manualListings}
          onToggleCompetitor={handleToggleCompetitor}
          onRunAnalysisWithCompetitors={() => {
            setShowManualUrls(true);
            const firstComp = manualListings.find(Boolean);
            const queryToUse =
              searchQuery.trim() ||
              firstComp?.tags?.[0] ||
              firstComp?.title?.split(/[,|\-–—]/)[0]?.trim() ||
              "etsy product";
            if (!searchQuery.trim()) {
              setSearchQuery(queryToUse);
            }
            handleAnalyze(undefined, queryToUse);
          }}
          onUpdateListing={(updated) => {
            setDownloaderInitialData(updated);
            // Sync with manual competitor slots if matching
            const matchedIdx = manualUrls.findIndex(
              (u, i) =>
                (updated.url && u && u.includes(updated.url)) ||
                (updated.listingId && manualListings[i]?.listingId === updated.listingId)
            );
            if (matchedIdx !== -1) {
              setManualListings((prev) => {
                const copy = [...prev];
                copy[matchedIdx] = updated;
                return copy;
              });
            }
          }}
        />
      </div>
    </AccessGate>
  );
}
