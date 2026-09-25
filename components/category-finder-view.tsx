"use client";

import React, { useState } from "react";
import {
  Search,
  FolderTree,
  Tag,
  Camera,
  Video,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { getCategoryMediaPlan } from "@/lib/media/category-media-plan";

interface CategoryEntry {
  id: string;
  name: string;
  query: string;
  path: string[];
  attributes: string[];
  suggestedTags: string[];
  description: string;
}

const CATEGORY_DATABASE: CategoryEntry[] = [
  {
    id: "ceramics",
    name: "Ceramics & Pottery",
    query: "ceramic coffee mug",
    path: ["Home & Living", "Kitchen & Dining", "Drinkware", "Mugs"],
    attributes: ["Capacity (oz/ml)", "Clay Body (Stoneware/Porcelain)", "Glaze Finish", "Microwave Safe", "Dishwasher Safe"],
    suggestedTags: ["ceramic coffee mug", "pottery mug", "stoneware cup", "handmade mug", "unique coffee cup", "wheel thrown mug", "tea lover gift", "ceramic art", "artisan mug", "rustic mug"],
    description: "Ceramics rank high on sensory aesthetics. Clear volume specs and food-safe glaze clarity significantly boost conversions.",
  },
  {
    id: "jewelry",
    name: "Handmade Jewelry",
    query: "sterling silver necklace",
    path: ["Jewelry", "Necklaces", "Pendants", "Chains"],
    attributes: ["Metal Purity (925 Silver/14K Gold)", "Chain Length (16/18/20 in)", "Clasp Type", "Gemstone/Birthstone", "Personalizable"],
    suggestedTags: ["dainty necklace", "birth flower gift", "sterling silver 925", "custom name pendant", "minimalist jewelry", "mothers day gift", "personalized necklace", "gold chain", "layering necklace", "bridesmaid jewelry"],
    description: "Necklace drop length and macro hallmark photography are essential to minimize return rates and maximize indexing score.",
  },
  {
    id: "leather",
    name: "Leather Goods & Wallets",
    query: "full grain leather wallet",
    path: ["Bags & Purses", "Wallets & Money Clips", "Wallets", "Bifold Wallets"],
    attributes: ["Leather Grade (Full-Grain/Top-Grain)", "Card Capacity", "RFID Blocking", "Colorway", "Monogram / Engraving"],
    suggestedTags: ["leather bifold wallet", "mens wallet", "personalized wallet", "custom engraved gift", "minimalist wallet", "anniversary gift for him", "groomsmen gift", "distressed leather", "edc wallet", "handmade leather"],
    description: "Buyers look for authentic pull-up grain texture, sturdy burnished edge stitching, and exact folded dimensions.",
  },
  {
    id: "digital",
    name: "Digital Downloads & Planners",
    query: "goodnotes digital planner",
    path: ["Paper & Party Supplies", "Paper", "Calendars & Planners", "Digital Planners"],
    attributes: ["File Formats (PDF/PNG/GoodNotes)", "Device Compatibility (iPad/Android)", "Hyperlinked Tabs", "Instant Download"],
    suggestedTags: ["digital planner", "goodnotes planner", "ipad planner", "daily planner 2026", "notability template", "undated planner", "productivity organizer", "digital journal", "instant download pdf", "budget planner"],
    description: "Clear instructions detailing tablet app compatibility and instant delivery prevent customer support friction.",
  },
  {
    id: "wood",
    name: "Woodworking & Kitchenware",
    query: "walnut cutting board",
    path: ["Home & Living", "Kitchen & Dining", "Cookware", "Cutting Boards"],
    attributes: ["Wood Species (Black Walnut/Hard Maple)", "Grain Type (End-Grain/Edge-Grain)", "Food-Grade Mineral Oil", "Juice Groove"],
    suggestedTags: ["walnut cutting board", "end grain butcher block", "charcuterie board", "personalized cutting board", "wedding gift for couple", "housewarming gift", "rustic kitchen decor", "engraved wood board", "large cheese board", "solid wood board"],
    description: "End-grain durability and food-safe mineral oil seasoning reassure premium buyers of heirloom durability.",
  },
  {
    id: "pet",
    name: "Pet Collars & Accessories",
    query: "personalized dog collar",
    path: ["Pet Supplies", "Pet Collars & Leashes", "Pet Collars", "Dog Collars"],
    attributes: ["Collar Width & Neck Size", "Hardware (Solid Brass/Steel)", "Laser Engraved Buckle", "Reflective"],
    suggestedTags: ["custom dog collar", "personalized pet collar", "engraved dog collar", "leather dog collar", "dog tag collar", "waterproof dog collar", "puppy gift", "durable dog collar", "dog lover gift", "reflective pet gear"],
    description: "Accurate neck sizing measurement charts and secure buckle pull-strength guidance are critical to buyer confidence.",
  },
];

interface CategoryFinderViewProps {
  onSearchNiche: (query: string) => void;
}

export function CategoryFinderView({ onSearchNiche }: CategoryFinderViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryEntry | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const mediaPlan = selectedCategory ? getCategoryMediaPlan(selectedCategory.name) : null;

  const filteredCategories = searchTerm.trim()
    ? CATEGORY_DATABASE.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.path.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
              Category &amp; Taxonomy Finder
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
            Discover official Etsy category paths, mandated attributes, and tailored 10-photo media plans for your product niche.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category or niche (e.g. jewelry, wood)..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#263244] text-xs text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Matching Categories when searching */}
      {searchTerm.trim() && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
            {filteredCategories.length > 0
              ? `Matching Categories (${filteredCategories.length}):`
              : "No categories matching this query. Try searching for jewelry, wallet, wood, pottery, or planner."}
          </span>
          {filteredCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                    selectedCategory?.id === cat.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white dark:bg-[#0F1621] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#263244] hover:bg-slate-50 dark:hover:bg-[#131C29]"
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content: Empty State vs Selected Category Details */}
      {!selectedCategory ? (
        <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <FolderTree className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
            No Category Selected
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
            Search for your product niche or category in the box above to inspect official Etsy taxonomy paths, mandatory attributes, and tailored 10-photo listing requirements.
          </p>
        </div>
      ) : mediaPlan ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8]">Active Category:</span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {selectedCategory.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSearchTerm("");
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white cursor-pointer px-2.5 py-1 rounded-lg bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244]"
            >
              Change Category
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Official Taxonomy & Attributes (1 Col) */}
        <div className="space-y-6">
          {/* Category Path Card */}
          <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
                Official Etsy Category Path
              </span>
              <button
                type="button"
                onClick={() => copyText("path", selectedCategory.path.join(" > "))}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                {copiedKey === "path" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Path</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#263244] flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-[#F8FAFC]">
              {selectedCategory.path.map((segment, idx) => (
                <React.Fragment key={idx}>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#172231] border border-slate-200 dark:border-[#263244]">
                    {segment}
                  </span>
                  {idx < selectedCategory.path.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
              {selectedCategory.description}
            </p>

            <button
              type="button"
              onClick={() => onSearchNiche(selectedCategory.query)}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <span>Benchmark Competitors in this Category</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Attributes Card */}
          <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
              Recommended Listing Attributes
            </span>
            <div className="space-y-2">
              {selectedCategory.attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#E2E8F0] p-2 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-100 dark:border-[#1E293B]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{attr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested High-Intent Tags Card */}
          <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
                Top Category Tags
              </span>
              <button
                type="button"
                onClick={() => copyText("tags", selectedCategory.suggestedTags.join(", "))}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                {copiedKey === "tags" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>Copy All</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedCategory.suggestedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Category Media Guidance (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Strategy Box */}
          <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Video className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#E2E8F0]">
                Etsy Video Blueprint: {mediaPlan.videoStrategy.title} ({mediaPlan.videoStrategy.durationSeconds})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed p-3.5 bg-slate-50 dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-[#1E293B]">
              {mediaPlan.videoStrategy.guidance}
            </p>
          </div>

          {/* 10 Photo Slots Card */}
          <div className="bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Camera className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#E2E8F0]">
                  Category 10-Photo Listing Strategy
                </span>
              </div>
              <span className="text-[11px] text-slate-400">10 / 10 Optimal Slots</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mediaPlan.photoSlots.map((slot) => (
                <div
                  key={slot.slot}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-[#263244] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                        {slot.slot}
                      </span>
                      <span>{slot.title}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    {slot.guidance}
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Focus: {slot.categoryRelevance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      ) : null}
    </div>
  );
}
