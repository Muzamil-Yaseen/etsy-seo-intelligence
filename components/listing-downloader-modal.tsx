"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Key,
  Layers,
  FileText,
  Tag as TagIcon,
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  FileArchive,
} from "lucide-react";
import JSZip from "jszip";

export interface ListingDownloaderData {
  listingId?: string | number | null;
  title?: string;
  description?: string;
  price?: string;
  currency?: string;
  shopName?: string;
  url?: string;
  images?: Array<{
    url: string;
    fullUrl: string;
    width?: number;
    height?: number;
  }> | string[];
  imageUrl?: string;
  tags?: string[];
  materials?: string[];
  source?: string;
}

interface ListingDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ListingDownloaderData | null;
  onUpdateListing?: (updated: ListingDownloaderData) => void;
}

/**
 * Normalizes any Etsy static image URL to full resolution
 */
function toFullResolutionUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  // If it's an Etsy static image, upgrade to il_fullxfull
  if (rawUrl.includes("etsystatic.com")) {
    return rawUrl.replace(/\/il_\d+x\w+\./, "/il_fullxfull.");
  }
  return rawUrl;
}

export function ListingDownloaderModal({
  isOpen,
  onClose,
  initialData,
  onUpdateListing,
}: ListingDownloaderModalProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [listing, setListing] = useState<ListingDownloaderData | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [activeTab, setActiveTab] = useState<"images" | "tags" | "info">("images");

  // Manual image URL input
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [showAddImage, setShowAddImage] = useState(false);

  // API Key management
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Copy feedback states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Batch download state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState("");

  // Preview lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("etsy_user_api_key");
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Sync initialData
  useEffect(() => {
    if (initialData) {
      setListing(initialData);
      if (initialData.url) {
        setUrlInput(initialData.url);
      }
    } else {
      setListing(null);
      setUrlInput("");
    }
    setFetchError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    try {
      const clean = apiKey.trim();
      if (clean) {
        localStorage.setItem("etsy_user_api_key", clean);
      } else {
        localStorage.removeItem("etsy_user_api_key");
      }
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2000);
    } catch {
      // Ignore
    }
  };

  const triggerCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch listing via API endpoint
  const handleFetchListing = async (targetUrl?: string) => {
    const query = (targetUrl || urlInput).trim();
    if (!query) return;

    setIsFetching(true);
    setFetchError("");

    try {
      const res = await fetch("/api/fetch-listing-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-etsy-api-key": apiKey.trim() } : {}),
        },
        body: JSON.stringify({
          url: query,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to retrieve listing details.");
      }

      const fetchedListing: ListingDownloaderData = {
        listingId: data.listing.listingId,
        title: data.listing.title,
        description: data.listing.description,
        price: data.listing.price,
        currency: data.listing.currency || "USD",
        shopName: data.listing.shopName,
        url: data.listing.url,
        images: data.listing.images || [],
        imageUrl: data.listing.imageUrl,
        tags: data.listing.tags || [],
        materials: data.listing.materials || [],
        source: data.listing.source,
      };

      setListing(fetchedListing);
      if (onUpdateListing) {
        onUpdateListing(fetchedListing);
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to fetch listing.");
    } finally {
      setIsFetching(false);
    }
  };

  // Extract list of all image URLs (upgraded to HD)
  const normalizedImages: string[] = (() => {
    if (!listing) return [];
    const list: string[] = [];

    if (Array.isArray(listing.images) && listing.images.length > 0) {
      for (const item of listing.images) {
        if (typeof item === "string" && item.trim()) {
          list.push(toFullResolutionUrl(item));
        } else if (item && typeof item === "object") {
          const full = item.fullUrl || item.url;
          if (full) list.push(toFullResolutionUrl(full));
        }
      }
    }

    if (listing.imageUrl && !list.includes(toFullResolutionUrl(listing.imageUrl))) {
      list.unshift(toFullResolutionUrl(listing.imageUrl));
    }

    return Array.from(new Set(list));
  })();

  // Download individual image
  const handleDownloadSingleImage = async (imgUrl: string, index: number) => {
    try {
      const fullUrl = toFullResolutionUrl(imgUrl);
      const res = await fetch(fullUrl, { mode: "cors" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanId = listing?.listingId || "listing";
      a.download = `etsy-${cleanId}-photo-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Direct tab fallback
      window.open(imgUrl, "_blank");
    }
  };

  // Download all images as ZIP
  const handleDownloadAllZip = async () => {
    if (normalizedImages.length === 0) return;
    setIsZipping(true);
    setZipProgress(`Starting download of ${normalizedImages.length} images...`);

    try {
      const zip = new JSZip();
      const folderName = `etsy-${listing?.listingId || "listing"}-hd-photos`;
      const imgFolder = zip.folder(folderName);

      for (let i = 0; i < normalizedImages.length; i++) {
        setZipProgress(`Fetching photo ${i + 1} of ${normalizedImages.length}...`);
        const url = normalizedImages[i];
        try {
          const res = await fetch(url, { mode: "cors" });
          const blob = await res.blob();
          imgFolder?.file(`photo-${String(i + 1).padStart(2, "0")}.jpg`, blob);
        } catch (e) {
          console.warn(`Could not include image ${i + 1}:`, e);
        }
      }

      setZipProgress("Packaging ZIP file...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(`Could not create ZIP: ${err.message}`);
    } finally {
      setIsZipping(false);
      setZipProgress("");
    }
  };

  // Add custom image URL
  const handleAddCustomImage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customImageUrl.trim();
    if (!clean) return;

    const full = toFullResolutionUrl(clean);
    const newEntry = { url: full, fullUrl: full };
    const existingImgs = listing?.images || [];
    const updatedImages = existingImgs.map((img) =>
      typeof img === "string" ? { url: img, fullUrl: img } : img
    );
    updatedImages.push(newEntry);

    const updated: ListingDownloaderData = {
      ...(listing || {}),
      images: updatedImages,
      imageUrl: listing?.imageUrl || full,
    };

    setListing(updated);
    if (onUpdateListing) onUpdateListing(updated);
    setCustomImageUrl("");
    setShowAddImage(false);
  };

  // Export listing to TXT
  const handleExportTxt = () => {
    if (!listing) return;
    const lines = [
      `ETSY LISTING EXPORT`,
      `===================`,
      `Title: ${listing.title || ""}`,
      `Listing ID: ${listing.listingId || "N/A"}`,
      `Shop: ${listing.shopName || "N/A"}`,
      `Price: $${listing.price || "N/A"} ${listing.currency || "USD"}`,
      `URL: ${listing.url || "N/A"}`,
      ``,
      `TAGS (${(listing.tags || []).length}):`,
      (listing.tags || []).join(", "),
      ``,
      `MATERIALS:`,
      (listing.materials || []).join(", "),
      ``,
      `DESCRIPTION:`,
      listing.description || "N/A",
      ``,
      `IMAGE URLS (${normalizedImages.length}):`,
      ...normalizedImages,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `etsy-listing-${listing.listingId || "details"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  // Export listing to JSON
  const handleExportJson = () => {
    if (!listing) return;
    const data = {
      listingId: listing.listingId,
      title: listing.title,
      price: listing.price,
      currency: listing.currency,
      shopName: listing.shopName,
      url: listing.url,
      tags: listing.tags,
      materials: listing.materials,
      description: listing.description,
      images: normalizedImages,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `etsy-listing-${listing.listingId || "details"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Etsy Listing Downloader & Inspector
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  HD Assets
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Download full-resolution images, export 13 tags, and inspect listing metadata.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL Input Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchListing();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste Etsy listing URL (e.g. https://www.etsy.com/listing/123456789/...)"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isFetching || !urlInput.trim()}
              className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
            >
              {isFetching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fetch Info</span>
                </>
              )}
            </button>
          </form>

          {fetchError && (
            <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Quick API Key toggle */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <Key className="w-3 h-3 text-slate-400" />
              <span>{apiKey ? "Etsy API Key connected" : "Add Etsy API Key for 1-click auto-fetch"}</span>
            </button>

            {apiKey && (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Active</span>
              </span>
            )}
          </div>

          {showApiKeyInput && (
            <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Official Etsy API Key</span>
                <a
                  href="https://developers.etsy.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Etsy API Keystring..."
                  className="flex-1 h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  {apiKeySaved ? "Saved!" : "Save"}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Stored safely in your browser. Allows automated downloading of 100% full-resolution gallery photos and tags.
              </p>
            </div>
          )}
        </div>

        {/* Listing Overview Card (if listing loaded) */}
        {listing ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Top Summary Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {listing.shopName || "Etsy Artisan"}
                  </span>
                  {listing.listingId && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                      ID: {listing.listingId}
                    </span>
                  )}
                  {listing.price && (
                    <span className="text-xs font-bold text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ${listing.price} {listing.currency || "USD"}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {listing.title || "Etsy Listing"}
                </h3>
              </div>

              {/* Utility actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {listing.url && (
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>View on Etsy</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleExportTxt}
                  className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                  title="Export listing text summary"
                >
                  <FileText className="w-3 h-3" />
                  <span>Export TXT</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer"
                  title="Export raw JSON"
                >
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Navigation tabs inside downloader */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("images")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "images"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Images ({normalizedImages.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("tags")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "tags"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>13 Tags ({(listing.tags || []).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "info"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Title & Description</span>
                </button>
              </div>

              {activeTab === "images" && normalizedImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  {isZipping ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{zipProgress || "Zipping..."}</span>
                    </>
                  ) : (
                    <>
                      <FileArchive className="w-3.5 h-3.5" />
                      <span>Download All ({normalizedImages.length} HD Photos)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* TAB: IMAGES GALLERY */}
            {activeTab === "images" && (
              <div className="space-y-4">
                {normalizedImages.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">No images automatically retrieved</h4>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                        Connect an Etsy API Key to retrieve all official gallery photos automatically, or paste an Etsy image URL below.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddImage(true)}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Paste Image URL</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {normalizedImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-square flex items-center justify-center shadow-sm"
                      >
                        <img
                          src={imgUrl}
                          alt={`Listing photo ${idx + 1}`}
                          className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Top badge */}
                        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => setLightboxImage(imgUrl)}
                            className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Preview Full
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleImage(imgUrl, idx)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer shadow-sm"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download HD</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Image URL bar */}
                <div className="pt-2">
                  {!showAddImage ? (
                    <button
                      type="button"
                      onClick={() => setShowAddImage(true)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Paste additional image URL (e.g. from Etsy CDN)</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAddCustomImage} className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="Paste image link (https://i.etsystatic.com/...)"
                        className="flex-1 h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Add Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddImage(false)}
                        className="h-9 px-2 text-slate-400 hover:text-slate-700 text-xs"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB: TAGS */}
            {activeTab === "tags" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Listing Tags ({(listing.tags || []).length} / 13)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Click any tag to copy, or copy all tags formatted for the Etsy listing editor.
                    </p>
                  </div>

                  {(listing.tags || []).length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          triggerCopy("tags-comma", (listing.tags || []).join(", "))
                        }
                        className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedKey === "tags-comma" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy All (Comma-Separated)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {(listing.tags || []).length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <TagIcon className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600">
                      No tags available for this listing. Connect an Etsy API key to retrieve live tags directly.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(listing.tags || []).map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => triggerCopy(`tag-${idx}`, tag)}
                        className="group px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                        <span className="font-medium">{tag}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({tag.length}/20)
                        </span>
                        {copiedKey === `tag-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: INFO & DESCRIPTION */}
            {activeTab === "info" && (
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Listing Title</span>
                    <button
                      type="button"
                      onClick={() => triggerCopy("title", listing.title || "")}
                      className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "title" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Title</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed">
                    {listing.title || "No title provided"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Length: {(listing.title || "").length} / 140 characters
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Description</span>
                    <button
                      type="button"
                      onClick={() => triggerCopy("desc", listing.description || "")}
                      className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "desc" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Description</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-sans">
                    {listing.description || "No description retrieved. Connect an Etsy API key for full text."}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty state before URL search */
          <div className="flex-1 p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-slate-900">
                Enter an Etsy listing link above
              </h3>
              <p className="text-xs text-slate-500">
                Paste any live Etsy listing link or listing ID to download all high-res photos, inspect tags, copy title and description.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Full preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between text-white">
              <span className="text-xs text-slate-300">Click anywhere to close</span>
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Open in new tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
