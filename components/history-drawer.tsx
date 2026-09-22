"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  RotateCcw,
  Copy,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  DollarSign,
} from "lucide-react";

export interface SavedListing {
  id: string;
  savedAt: number;
  dateFormatted: string;
  productNoun: string;
  mainBroadPhrase: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  careInstructions?: string;
  faqs?: Array<{ question: string; answer: string }>;
  grade?: string;
  score?: number;
  urls: {
    u1: string;
    u2: string;
    u3: string;
  };
  prices?: {
    p1?: string;
    p2?: string;
    p3?: string;
  };
  rawResult?: any;
}

const STORAGE_KEY = "verdana_saved_listings";
const MAX_HISTORY_ITEMS = 50;

export function getSavedListings(): SavedListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveListingToHistory(listing: Omit<SavedListing, "id" | "savedAt" | "dateFormatted"> & { id?: string }): SavedListing[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getSavedListings();
    const now = Date.now();
    const dateFormatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(now));

    const newItem: SavedListing = {
      ...listing,
      id: listing.id || `listing_${now}_${Math.random().toString(36).substring(2, 7)}`,
      savedAt: now,
      dateFormatted,
    };

    // Remove any exact duplicate if it has the exact same main title or URLs
    const filtered = existing.filter(
      (item) =>
        item.title.trim().toLowerCase() !== newItem.title.trim().toLowerCase() &&
        item.id !== newItem.id
    );

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to persist listing history:", err);
    return [];
  }
}

export function deleteSavedListing(id: string): SavedListing[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getSavedListings();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllSavedListings(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (item: SavedListing) => void;
}

export function HistoryDrawer({ isOpen, onClose, onRestore }: HistoryDrawerProps) {
  const [history, setHistory] = useState<SavedListing[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHistory(getSavedListings());
      setConfirmClear(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSavedListing(id);
    setHistory(updated);
  };

  const handleClear = () => {
    clearAllSavedListings();
    setHistory([]);
    setConfirmClear(false);
  };

  const handleCopyListing = (item: SavedListing, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = [
      "=== 1. RECOMMENDED ETSY TITLE ===",
      item.title,
      "",
      "=== 2. RECOMMENDED CATEGORY ===",
      item.category,
      "",
      "=== 3. 13 ETSY TAGS (COMMA-SEPARATED) ===",
      item.tags.join(", "),
      "",
      "=== 4. LISTING DESCRIPTION ===",
      item.description,
      "",
      "=== 5. CARE INSTRUCTIONS ===",
      item.careInstructions || "N/A",
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#E2E8F0] bg-[#0F172A] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#22C55E]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-heading text-white">
                    Saved History
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#059669] text-white text-xs font-bold font-mono">
                    {history.length}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Auto-persisted in local browser storage
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition"
              title="Close drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 divide-y divide-[#F1F5F9]">
            {history.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#0F172A]">
                  No Saved Listings Yet
                </h4>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-xs mx-auto">
                  Whenever you analyze competitor listings or edit details, they will automatically be safely saved here.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onRestore(item)}
                  className="pt-3.5 first:pt-0 group cursor-pointer"
                >
                  <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#059669] hover:shadow-md bg-white hover:bg-[#F8FAFC]/50 transition space-y-3">
                    {/* Top line: Noun & Timestamp */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F172A] text-sm sm:text-base capitalize font-heading">
                            {item.productNoun || "Product Listing"}
                          </span>
                          {item.grade && (
                            <span className="px-1.5 py-0.5 rounded bg-[#059669]/10 text-[#059669] text-xs font-bold font-mono">
                              {item.grade} {item.score ? `(${item.score}%)` : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{item.dateFormatted}</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleCopyListing(item, e)}
                          className="p-1.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition"
                          title="Copy listing text"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-[#059669]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition"
                          title="Delete from history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Broad Phrase */}
                    {item.mainBroadPhrase && (
                      <div className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded-lg text-[#0F172A]">
                        <span className="text-[#64748B] font-medium">Broad: </span>
                        <strong className="capitalize">&ldquo;{item.mainBroadPhrase}&rdquo;</strong>
                      </div>
                    )}

                    {/* Title preview */}
                    <div className="text-xs text-[#334155] line-clamp-2 leading-relaxed font-medium">
                      {item.title}
                    </div>

                    {/* Footer stats: tags count and restore cue */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs">
                      <span className="text-[#64748B] font-mono">
                        {item.tags?.length || 0} tags • {item.category?.split(" > ").pop() || "Etsy"}
                      </span>
                      <div className="flex items-center gap-1 text-[#059669] font-bold group-hover:translate-x-0.5 transition-transform">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {history.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
              {confirmClear ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="text-xs text-[#DC2626] font-semibold">
                    Delete all {history.length} saved listings?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#DC2626] text-white"
                    >
                      Yes, Clear All
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-xs text-[#64748B]">
                    Max {MAX_HISTORY_ITEMS} listings saved locally
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#DC2626] font-semibold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
