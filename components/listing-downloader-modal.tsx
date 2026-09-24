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
  Zap,
  ClipboardPaste,
  Terminal,
  Puzzle,
  Users,
  Video,
} from "lucide-react";
import JSZip from "jszip";
import { ETSY_BOOKMARKLET_CODE, ETSY_CONSOLE_SNIPPET } from "@/lib/bookmarklet";

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
  videos?: Array<{
    url: string;
    posterUrl?: string;
    format?: string;
  }> | string[];
  videoUrl?: string;
  tags?: string[];
  materials?: string[];
  source?: string;
  formattedText?: string;
  tagsString?: string;
  fetchedAt?: string;
}

export interface ListingDownloaderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isPage?: boolean;
  initialData?: ListingDownloaderData | null;
  onUpdateListing?: (updated: ListingDownloaderData) => void;
  competitors?: (ListingDownloaderData | null)[];
  onToggleCompetitor?: (listing: ListingDownloaderData) => {
    success: boolean;
    action: "added" | "removed" | "full";
    slot?: number;
  };
  onRunAnalysisWithCompetitors?: () => void;
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

/**
 * Robust media fetcher for browser client:
 * 1. Attempts direct fetch with mode: 'cors'
 * 2. If blocked by Etsy CDN CORS headers on localhost, cleanly proxies through /api/proxy-media
 * This prevents empty ZIPs and failed media downloads.
 */
async function fetchMediaBlob(url: string): Promise<Blob> {
  if (!url) throw new Error("No URL provided");
  try {
    const directRes = await fetch(url, { mode: "cors" });
    if (directRes.ok) {
      return await directRes.blob();
    }
  } catch {
    // Direct fetch failed (likely CORS on localhost), proxy will handle it
  }

  const proxyRes = await fetch(`/api/proxy-media?url=${encodeURIComponent(url)}`);
  if (!proxyRes.ok) {
    throw new Error(`Media fetch failed: ${proxyRes.status} ${proxyRes.statusText}`);
  }
  return await proxyRes.blob();
}

export function ListingDownloaderModal({
  isOpen = false,
  onClose,
  isPage = false,
  initialData,
  onUpdateListing,
  competitors,
  onToggleCompetitor,
  onRunAnalysisWithCompetitors,
}: ListingDownloaderModalProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [listing, setListing] = useState<ListingDownloaderData | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [activeTab, setActiveTab] = useState<"images" | "videos" | "tags" | "info">("images");

  // Mode: Single Listing vs Bulk Downloader
  const [downloaderMode, setDownloaderMode] = useState<"single" | "bulk">("single");
  const [bulkUrlsText, setBulkUrlsText] = useState("");
  const [bulkListings, setBulkListings] = useState<ListingDownloaderData[]>([]);
  const [isBulkFetching, setIsBulkFetching] = useState(false);
  const [bulkFetchProgress, setBulkFetchProgress] = useState("");
  const [isBulkZipping, setIsBulkZipping] = useState(false);

  // Manual image URL input
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [showAddImage, setShowAddImage] = useState(false);

  // API Key management
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Bookmarklet helper
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);
  const [consoleSnippetCopied, setConsoleSnippetCopied] = useState(false);

  // Copy feedback states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Competitor feedback toast
  const [competitorToast, setCompetitorToast] = useState<string | null>(null);

  // Batch download state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState("");

  // Preview lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const currentCompetitorSlot = React.useMemo(() => {
    if (!listing || !competitors) return -1;
    return competitors.findIndex(
      (c) =>
        c &&
        ((c.listingId && listing.listingId && String(c.listingId) === String(listing.listingId)) ||
          (c.url && listing.url && c.url === listing.url))
    );
  }, [listing, competitors]);

  const competitorCount = React.useMemo(() => {
    if (!competitors) return 0;
    return competitors.filter(Boolean).length;
  }, [competitors]);

  const handleToggleCurrentListingCompetitor = () => {
    if (!listing || !onToggleCompetitor) return;
    const res = onToggleCompetitor(listing);
    if (res.action === "added") {
      setCompetitorToast(
        `✓ Added to Competitor Analysis (Slot #${(res.slot ?? 0) + 1} of 3)!`
      );
      setTimeout(() => setCompetitorToast(null), 4000);
    } else if (res.action === "removed") {
      setCompetitorToast(
        `Removed from Competitor Slot #${(res.slot ?? 0) + 1}.`
      );
      setTimeout(() => setCompetitorToast(null), 3000);
    } else if (res.action === "full") {
      setCompetitorToast(
        "⚠️ Maximum 3 competitors allowed. Please remove one in the studio first."
      );
      setTimeout(() => setCompetitorToast(null), 4000);
    }
  };

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

  const handleImportJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString.trim());
      if (parsed && (parsed.images || parsed.tags || parsed.listingId || parsed.title)) {
        const importedData: ListingDownloaderData = {
          listingId: parsed.listingId,
          title: parsed.title,
          description: parsed.description,
          price: parsed.price,
          currency: parsed.currency || "USD",
          shopName: parsed.shopName,
          url: parsed.url,
          images: parsed.images || [],
          imageUrl: parsed.imageUrl,
          videos: parsed.videos || (parsed.videoUrl ? [{ url: parsed.videoUrl }] : []),
          videoUrl: parsed.videoUrl,
          tags: parsed.tags || [],
          materials: parsed.materials || [],
          source: parsed.source || "bookmarklet",
        };
        setListing(importedData);
        if (parsed.url) setUrlInput(parsed.url);
        if (onUpdateListing) onUpdateListing(importedData);
        setFetchError("");
        return true;
      }
    } catch {
      // not JSON
    }
    return false;
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setFetchError("Clipboard is empty. Copy from Etsy first!");
        return;
      }
      const trimmed = text.trim();
      if (trimmed.startsWith("{")) {
        const imported = handleImportJson(trimmed);
        if (imported) {
          setFetchError("");
          return;
        }
      }
      if (trimmed.includes("etsy.com/listing/")) {
        setUrlInput(trimmed);
        handleFetchListing(trimmed);
        return;
      }
      setFetchError("Clipboard does not contain Etsy listing data or an Etsy URL.");
    } catch {
      setFetchError("Browser blocked clipboard access. Please press Ctrl+V directly to paste!");
    }
  };

  // Global paste event handler inside modal
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          (target.tagName === "INPUT" && target.getAttribute("type") === "text"))
      ) {
        return;
      }
      const text = e.clipboardData?.getData("text");
      if (text && text.trim().startsWith("{")) {
        const success = handleImportJson(text);
        if (success) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

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

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(ETSY_BOOKMARKLET_CODE);
    setBookmarkletCopied(true);
    setTimeout(() => setBookmarkletCopied(false), 2000);
  };

  const handleCopyConsoleSnippet = () => {
    navigator.clipboard.writeText(ETSY_CONSOLE_SNIPPET);
    setConsoleSnippetCopied(true);
    setTimeout(() => setConsoleSnippetCopied(false), 2000);
  };

  // Fetch listing via API endpoint
  const handleFetchListing = async (targetUrl?: string) => {
    const query = (targetUrl || urlInput).trim();
    if (!query) return;

    if (query.startsWith("{")) {
      const imported = handleImportJson(query);
      if (imported) return;
    }

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
        videos: data.listing.videos || (data.listing.videoUrl ? [{ url: data.listing.videoUrl }] : []),
        videoUrl: data.listing.videoUrl,
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

  // Extract list of all video URLs with metadata
  const normalizedVideos: Array<{ url: string; posterUrl?: string; format?: string }> = (() => {
    if (!listing) return [];
    const list: Array<{ url: string; posterUrl?: string; format?: string }> = [];
    const seenUrls = new Set<string>();

    if (Array.isArray(listing.videos) && listing.videos.length > 0) {
      for (const item of listing.videos) {
        if (typeof item === "string" && item.trim()) {
          const u = item.trim();
          if (!seenUrls.has(u)) {
            seenUrls.add(u);
            list.push({ url: u, format: u.includes(".m3u8") ? "HLS" : "MP4" });
          }
        } else if (item && typeof item === "object" && item.url) {
          const u = item.url.trim();
          if (!seenUrls.has(u)) {
            seenUrls.add(u);
            list.push({
              url: u,
              posterUrl: item.posterUrl,
              format: item.format || (u.includes(".m3u8") ? "HLS" : "MP4"),
            });
          }
        }
      }
    }

    if (listing.videoUrl && !seenUrls.has(listing.videoUrl.trim())) {
      const u = listing.videoUrl.trim();
      seenUrls.add(u);
      list.unshift({ url: u, format: u.includes(".m3u8") ? "HLS" : "MP4" });
    }

    return list;
  })();

  // Download individual image using fetchMediaBlob (falls back to /api/proxy-media to prevent CORS errors)
  const handleDownloadSingleImage = async (imgUrl: string, index: number) => {
    try {
      const fullUrl = toFullResolutionUrl(imgUrl);
      const blob = await fetchMediaBlob(fullUrl);
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
      window.open(imgUrl, "_blank");
    }
  };

  // Download individual video using fetchMediaBlob
  const handleDownloadSingleVideo = async (videoUrl: string, index: number) => {
    try {
      const blob = await fetchMediaBlob(videoUrl);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanId = listing?.listingId || "listing";
      a.download = `etsy-${cleanId}-video-${index + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(videoUrl, "_blank");
    }
  };

  // Generate 13 smart high-intent SEO tags from Title and Description
  const handleAutoGenerateTags = () => {
    if (!listing) return;
    const title = listing.title || "";
    const desc = listing.description || "";
    const stopWords = new Set([
      "and", "or", "the", "in", "on", "with", "for", "of", "at", "by", "from",
      "a", "an", "is", "it", "to", "this", "that", "style", "handmade", "custom", "shop", "listing"
    ]);
    const newTags = new Set<string>();

    // 1. Phrasal segments from title
    title.split(/[,|\-–—]/).forEach((part) => {
      const clean = part.trim().toLowerCase();
      if (clean.length >= 3 && clean.length <= 20) newTags.add(clean);
    });

    // 2. 2-3 word n-grams
    const combined = `${title} ${desc}`.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = combined.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
    for (let i = 0; i < words.length - 1 && newTags.size < 13; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length <= 20) newTags.add(bigram);
      if (i < words.length - 2 && newTags.size < 13) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (trigram.length <= 20) newTags.add(trigram);
      }
    }

    const finalTags = Array.from(newTags).slice(0, 13);
    const updated = { ...listing, tags: finalTags };
    setListing(updated);
    if (onUpdateListing) onUpdateListing(updated);
  };

  // Download all media (HD images & videos) as ZIP with proxy fallback to prevent empty ZIPs
  const handleDownloadAllZip = async () => {
    const totalAssets = normalizedImages.length + normalizedVideos.length;
    if (totalAssets === 0) return;
    setIsZipping(true);
    setZipProgress(
      `Starting download (${normalizedImages.length} photo${normalizedImages.length === 1 ? "" : "s"}${
        normalizedVideos.length > 0 ? ` + ${normalizedVideos.length} video${normalizedVideos.length === 1 ? "" : "s"}` : ""
      })...`
    );

    try {
      const zip = new JSZip();
      const folderName = `etsy-${listing?.listingId || "listing"}-hd-assets`;
      const mediaFolder = zip.folder(folderName);
      let savedCount = 0;

      // 1. Download all HD photos
      for (let i = 0; i < normalizedImages.length; i++) {
        setZipProgress(`Fetching photo ${i + 1} of ${normalizedImages.length}...`);
        const url = normalizedImages[i];
        try {
          const blob = await fetchMediaBlob(url);
          mediaFolder?.file(`photo-${String(i + 1).padStart(2, "0")}.jpg`, blob);
          savedCount++;
        } catch (e) {
          console.warn(`Could not include image ${i + 1}:`, e);
        }
      }

      // 2. Download any listing videos
      for (let j = 0; j < normalizedVideos.length; j++) {
        setZipProgress(`Fetching video ${j + 1} of ${normalizedVideos.length}...`);
        const v = normalizedVideos[j];
        try {
          const blob = await fetchMediaBlob(v.url);
          mediaFolder?.file(`video-${String(j + 1).padStart(2, "0")}.mp4`, blob);
          savedCount++;
        } catch (e) {
          console.warn(`Could not include video ${j + 1}:`, e);
        }
      }

      if (savedCount === 0) {
        throw new Error(
          "Could not download any media assets. Please check your network connection or try downloading files individually."
        );
      }

      setZipProgress(`Packaging ${savedCount} asset${savedCount === 1 ? "" : "s"} into ZIP...`);
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
      ...(normalizedVideos.length > 0
        ? [
            ``,
            `VIDEO URLS (${normalizedVideos.length}):`,
            ...normalizedVideos.map((v) => v.url),
          ]
        : []),
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
      videos: normalizedVideos,
      videoUrl: normalizedVideos[0]?.url || "",
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

  // Bulk Fetch Handler
  const handleBulkFetch = async () => {
    const rawLines = bulkUrlsText
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) return;
    setIsBulkFetching(true);
    const resultsList: ListingDownloaderData[] = [...bulkListings];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      setBulkFetchProgress(`Fetching listing ${i + 1} of ${rawLines.length}...`);
      try {
        const res = await fetch(`/api/fetch-listing?url=${encodeURIComponent(line)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.listing) {
            resultsList.push({
              listingId: data.listing.listingId,
              title: data.listing.title,
              description: data.listing.description,
              price: data.listing.price,
              currency: data.listing.currency || "USD",
              shopName: data.listing.shopName,
              url: data.listing.url || line,
              images: data.listing.images || [],
              imageUrl: data.listing.imageUrl,
              videos: data.listing.videos || (data.listing.videoUrl ? [{ url: data.listing.videoUrl }] : []),
              videoUrl: data.listing.videoUrl,
              tags: data.listing.tags || [],
              materials: data.listing.materials || [],
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch bulk listing ${i}:`, e);
      }
    }

    setBulkListings(resultsList);
    setIsBulkFetching(false);
    setBulkFetchProgress("");
    setBulkUrlsText("");
  };

  // Bulk ZIP Download Handler
  const handleDownloadBulkZip = async () => {
    if (bulkListings.length === 0) return;
    setIsBulkZipping(true);
    setBulkFetchProgress("Starting bulk packaging...");

    try {
      const zip = new JSZip();
      let totalPhotos = 0;

      for (let b = 0; b < bulkListings.length; b++) {
        const item = bulkListings[b];
        const cleanShop = (item.shopName || "etsy").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 15);
        const folderName = `item-${b + 1}-${item.listingId || "listing"}-${cleanShop}`;
        const subFolder = zip.folder(folderName);

        const imgs: string[] = [];
        if (Array.isArray(item.images)) {
          for (const raw of item.images) {
            if (typeof raw === "string") imgs.push(toFullResolutionUrl(raw));
            else if (raw && typeof raw === "object") imgs.push(toFullResolutionUrl(raw.fullUrl || raw.url));
          }
        }
        if (item.imageUrl && !imgs.includes(toFullResolutionUrl(item.imageUrl))) {
          imgs.unshift(toFullResolutionUrl(item.imageUrl));
        }

        for (let p = 0; p < imgs.length; p++) {
          setBulkFetchProgress(`Item ${b + 1}/${bulkListings.length}: Photo ${p + 1}/${imgs.length}...`);
          try {
            const blob = await fetchMediaBlob(imgs[p]);
            subFolder?.file(`photo-${String(p + 1).padStart(2, "0")}.jpg`, blob);
            totalPhotos++;
          } catch {
            // continue
          }
        }
      }

      setBulkFetchProgress(`Compressing ${totalPhotos} HD photos into ZIP...`);
      const blob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `etsy-bulk-listings-${bulkListings.length}-items.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(`Could not create bulk ZIP: ${err.message}`);
    } finally {
      setIsBulkZipping(false);
      setBulkFetchProgress("");
    }
  };

  // Bulk CSV Export Handler
  const handleExportBulkTagsCsv = () => {
    if (bulkListings.length === 0) return;
    const headers = ["Listing ID", "Shop Name", "Price", "Currency", "Title", "URL", "Tag 1", "Tag 2", "Tag 3", "Tag 4", "Tag 5", "Tag 6", "Tag 7", "Tag 8", "Tag 9", "Tag 10", "Tag 11", "Tag 12", "Tag 13"];
    const rows = bulkListings.map((item) => {
      const tags = (item.tags || []).slice(0, 13);
      const row = [
        `"${item.listingId || ""}"`,
        `"${(item.shopName || "").replace(/"/g, '""')}"`,
        `"${item.price || ""}"`,
        `"${item.currency || "USD"}"`,
        `"${(item.title || "").replace(/"/g, '""')}"`,
        `"${item.url || ""}"`,
        ...Array.from({ length: 13 }).map((_, i) => `"${(tags[i] || "").replace(/"/g, '""')}"`),
      ];
      return row.join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `etsy-bulk-tags-${bulkListings.length}-listings.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const mainView = (
    <div className={`relative w-full ${isPage ? "" : "max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden"} bg-white dark:bg-[#0B1019] rounded-2xl border border-slate-200 dark:border-[#263244] text-slate-900 dark:text-[#F8FAFC] flex flex-col`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-[#263244] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0F1621]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#14B8A6]/20 border border-emerald-200 dark:border-[#14B8A6]/30 text-emerald-600 dark:text-[#14B8A6] flex items-center justify-center shadow-xs shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Etsy Listing &amp; Media Downloader
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#14B8A6]/10 dark:text-[#14B8A6] dark:border-[#14B8A6]/30">
                HD Assets &amp; ZIP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Download full-resolution images, export 13 tags, and inspect listing metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Mode Switcher: Single vs Bulk */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDownloaderMode("single")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                downloaderMode === "single"
                  ? "bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]"
              }`}
            >
              Single Listing
            </button>
            <button
              type="button"
              onClick={() => setDownloaderMode("bulk")}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                downloaderMode === "bulk"
                  ? "bg-white dark:bg-[#1F2937] text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]"
              }`}
            >
              Bulk Downloader {bulkListings.length > 0 && `(${bulkListings.length})`}
            </button>
          </div>

          {!isPage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

        {downloaderMode === "bulk" ? (
          <div className="p-5 space-y-5 bg-white dark:bg-[#0B1019]">
            {/* Bulk Input Card */}
            <div className="p-4 bg-slate-50 dark:bg-[#0F1621] rounded-xl border border-slate-200 dark:border-[#263244] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                    Bulk Listing URLs &amp; Competitors
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                    Paste multiple Etsy listing URLs or listing IDs (one per line, up to 15 listings).
                  </p>
                </div>
                {competitors && competitors.some(Boolean) && (
                  <button
                    type="button"
                    onClick={() => {
                      const compUrls = competitors.filter(Boolean).map((c) => c?.url || "").filter(Boolean);
                      setBulkUrlsText((prev) => {
                        const existing = prev ? prev.trim() + "\n" : "";
                        return existing + compUrls.join("\n");
                      });
                    }}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer"
                  >
                    + Import from Active Competitor Slots
                  </button>
                )}
              </div>

              <textarea
                value={bulkUrlsText}
                onChange={(e) => setBulkUrlsText(e.target.value)}
                placeholder={"https://www.etsy.com/listing/123456789/vintage-ceramic-mug\nhttps://www.etsy.com/listing/987654321/handmade-leather-wallet"}
                rows={4}
                className="w-full p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] rounded-xl text-xs font-mono text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-emerald-500 transition"
              />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  {bulkUrlsText.split(/[\n,]/).filter((l) => l.trim().length > 0).length} links queued
                </span>
                <button
                  type="button"
                  onClick={handleBulkFetch}
                  disabled={isBulkFetching || !bulkUrlsText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs transition"
                >
                  {isBulkFetching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{bulkFetchProgress || "Fetching..."}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Fetch All Listings ({bulkUrlsText.split(/[\n,]/).filter((l) => l.trim().length > 0).length || 0})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bulk Listings Table / Grid */}
            {bulkListings.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-slate-50 dark:bg-[#0F1621] rounded-xl border border-slate-200 dark:border-[#263244]">
                  <div className="text-xs text-slate-700 dark:text-[#F8FAFC] font-semibold">
                    <span>Ready to download: </span>
                    <strong className="text-emerald-700 dark:text-[#14B8A6]">{bulkListings.length} Listings</strong>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportBulkTagsCsv}
                      className="px-3 py-1.5 bg-white dark:bg-[#131C29] border border-slate-200 dark:border-[#263244] hover:border-slate-300 text-slate-700 dark:text-[#F8FAFC] text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Export All Tags (.CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBulkZip}
                      disabled={isBulkZipping}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      {isBulkZipping ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{bulkFetchProgress || "Creating ZIP..."}</span>
                        </>
                      ) : (
                        <>
                          <FileArchive className="w-3.5 h-3.5" />
                          <span>Download All Photos (.ZIP)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkListings([])}
                      className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {bulkListings.map((bItem, bIdx) => {
                    const firstImg = (Array.isArray(bItem.images) && bItem.images[0])
                      ? (typeof bItem.images[0] === "string" ? bItem.images[0] : (bItem.images[0] as any).fullUrl || (bItem.images[0] as any).url)
                      : bItem.imageUrl;
                    return (
                      <div
                        key={bIdx}
                        className="p-3 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-xl flex items-center gap-3 shadow-2xs"
                      >
                        {firstImg ? (
                          <img
                            src={toFullResolutionUrl(firstImg)}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-[#263244]"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                            {bItem.title || "Etsy Listing"}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-[#94A3B8]">
                            <span>{bItem.shopName || "Etsy Shop"}</span>
                            {bItem.price && <span>• ${bItem.price}</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium">
                              {(bItem.tags || []).length} tags
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setListing(bItem);
                                setDownloaderMode("single");
                              }}
                              className="text-emerald-600 dark:text-[#14B8A6] font-semibold hover:underline cursor-pointer"
                            >
                              Inspect Single ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* SINGLE LISTING MODE */
          <>
        {/* URL Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#263244] bg-slate-50 dark:bg-[#0F1621]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchListing();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.trim().startsWith("{")) {
                    handleImportJson(val);
                  } else {
                    setUrlInput(val);
                  }
                }}
                placeholder="Paste Etsy listing URL or extracted JSON..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263244] text-xs text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              title="Paste listing data or URL from clipboard (Ctrl+V)"
              className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131C29] dark:hover:bg-[#172231] text-slate-800 dark:text-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 border border-slate-200 dark:border-[#263244]"
            >
              <ClipboardPaste className="w-4 h-4 text-[#14B8A6]" />
              <span>Paste (Ctrl+V)</span>
            </button>
            <button
              type="submit"
              disabled={isFetching || !urlInput.trim()}
              className="font-heading h-10 px-4 rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] disabled:opacity-50 text-[#021A17] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
            >
              {isFetching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#021A17]" />
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

          {/* Quick Options: Chrome Extension & API Key */}
          <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBookmarklet(!showBookmarklet);
                  if (showApiKeyInput) setShowApiKeyInput(false);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition ${
                  showBookmarklet
                    ? "bg-amber-100 text-amber-900 font-bold border border-amber-300"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                <Puzzle className="w-3.5 h-3.5 text-amber-600" />
                <span>⚡ Chrome Extension (Zero API Setup)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowApiKeyInput(!showApiKeyInput);
                  if (showBookmarklet) setShowBookmarklet(false);
                }}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
              >
                <Key className="w-3 h-3 text-slate-400" />
                <span>{apiKey ? "Etsy API Key connected" : "Etsy API Key (Advanced)"}</span>
              </button>

              {apiKey && (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Active</span>
                </span>
              )}
            </div>
          </div>

          {/* Chrome Extension & Zero-API Extractor Guide Drawer */}
          {showBookmarklet && (
            <div className="mt-3 p-4 bg-gradient-to-br from-amber-50/90 to-amber-100/50 rounded-xl border border-amber-200 text-xs space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Puzzle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-slate-900">Official Chrome Extension</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200 text-amber-900">
                    Recommended (Like EverBee &amp; Alura)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookmarklet(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Main Banner: Download Extension */}
              <div className="p-3.5 bg-white rounded-xl border border-amber-200 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      1-Click Etsy Intelligence Extension
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Injects an <strong>⚡ Open in Studio ↗</strong> button directly onto every live Etsy listing page. Seamlessly sends all HD photos (`il_fullxfull`), 13 tags, and prices straight to this studio without API keys or Cloudflare blocks!
                    </p>
                  </div>
                  <a
                    href="/api/download-extension"
                    download="etsy-intelligence-extension.zip"
                    className="shrink-0 px-3.5 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition border border-black cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>Download Extension (.ZIP)</span>
                  </a>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 text-[11px]">30-Second Setup:</div>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    <li>Download and <strong>unzip</strong> the extension folder.</li>
                    <li>In Chrome/Edge, visit <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">chrome://extensions</code> and turn on <strong>Developer mode</strong> (top-right toggle).</li>
                    <li>Click <strong>Load unpacked</strong> and select the unzipped <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">extension</code> folder.</li>
                    <li>Browse to any Etsy listing — click the floating <strong>⚡ Open in Studio ↗</strong> button, and your listing instantly opens right here!</li>
                  </ol>
                </div>
              </div>

              {/* Quick Fallback Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Fallback 1: Console Snippet */}
                <div className="p-3 bg-white/80 rounded-xl border border-amber-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-slate-700" />
                      <span>Instant Console (No Install)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                      Fast
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    On Etsy, press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">F12</kbd> (Console), paste this snippet, and hit Enter.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyConsoleSnippet}
                    className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                  >
                    {consoleSnippetCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Console Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Fallback 2: Bookmarklet */}
                <div className="p-3 bg-white/80 rounded-xl border border-amber-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      <span>Browser Bookmarklet</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Right-click bookmarks bar → Add page → Paste code into URL field.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyBookmarklet}
                    className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                  >
                    {bookmarkletCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Bookmarklet Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Bookmarklet Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  className="h-8 px-3 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-black"
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Competitor Benchmarking Slots Strip (Max 3) */}
            {competitors && (
              <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    <span>Competitor Slots ({competitorCount}/3):</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[0, 1, 2].map((slot) => {
                      const comp = competitors[slot];
                      const isThis =
                        comp &&
                        listing &&
                        (String(comp.listingId) === String(listing.listingId) ||
                          comp.url === listing.url);
                      return (
                        <div
                          key={slot}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 border transition ${
                            comp
                              ? isThis
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              : "bg-slate-100/60 border-dashed border-slate-300 text-slate-400"
                          }`}
                        >
                          <span className="font-mono text-[10px] text-slate-500">#{slot + 1}</span>
                          {comp ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setListing(comp)}
                                className="truncate max-w-[130px] hover:underline cursor-pointer text-left"
                                title={comp.title || "View competitor"}
                              >
                                {comp.title || `Competitor #${slot + 1}`}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleCompetitor?.(comp);
                                }}
                                className="text-slate-400 hover:text-red-600 cursor-pointer ml-0.5"
                                title="Remove competitor"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <span>Empty Slot</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {competitorCount > 0 && onRunAnalysisWithCompetitors && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose?.();
                      onRunAnalysisWithCompetitors();
                    }}
                    className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-xs self-start sm:self-auto transition"
                  >
                    <span>Analyze {competitorCount} Competitor{competitorCount > 1 ? "s" : ""} ↗</span>
                  </button>
                )}
              </div>
            )}

            {/* Competitor Feedback Toast */}
            {competitorToast && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{competitorToast}</span>
                </div>
                {onRunAnalysisWithCompetitors && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose?.();
                      onRunAnalysisWithCompetitors();
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition cursor-pointer shrink-0"
                  >
                    View in Studio ↗
                  </button>
                )}
              </div>
            )}

            {/* Top Summary Box */}
            <div className="p-4 bg-white dark:bg-[#0F1621] border border-slate-200 dark:border-[#263244] rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-2xs">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#64748B] uppercase tracking-wider">
                    {listing.shopName || "Etsy Artisan"}
                  </span>
                  {listing.listingId && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-[#131C29] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-[#263244]">
                      ID: {listing.listingId}
                    </span>
                  )}
                  {listing.price && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-[#14B8A6] font-mono bg-emerald-50 dark:bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-[#14B8A6]/30">
                      ${listing.price} {listing.currency || "USD"}
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-sm font-semibold text-slate-900 dark:text-[#F8FAFC] line-clamp-2">
                  {listing.title || "Etsy Listing"}
                </h3>
              </div>

              {/* Utility actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Add as Competitor Button (Max 3) */}
                {onToggleCompetitor && (
                  <button
                    type="button"
                    onClick={handleToggleCurrentListingCompetitor}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer border ${
                      currentCompetitorSlot !== -1
                        ? "bg-emerald-50 dark:bg-[#14B8A6]/20 text-emerald-700 dark:text-[#14B8A6] border-emerald-300 dark:border-[#14B8A6]/40 hover:bg-emerald-100 dark:hover:bg-[#14B8A6]/30 shadow-xs"
                        : competitorCount >= 3
                        ? "bg-slate-100 dark:bg-[#131C29] text-slate-400 dark:text-[#64748B] border-slate-200 dark:border-[#263244]"
                        : "bg-emerald-600 dark:bg-[#14B8A6] text-white dark:text-[#021A17] hover:bg-emerald-700 dark:hover:bg-[#2DD4BF] border-transparent font-bold shadow-xs"
                    }`}
                    title={
                      currentCompetitorSlot !== -1
                        ? "Click to remove from competitor analysis"
                        : competitorCount >= 3
                        ? "Maximum 3 competitors reached"
                        : "Add this listing as a competitor (up to 3)"
                    }
                  >
                    {currentCompetitorSlot !== -1 ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#14B8A6]" />
                        <span>Competitor #{currentCompetitorSlot + 1} Added</span>
                      </>
                    ) : competitorCount >= 3 ? (
                      <>
                        <Users className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B]" />
                        <span>Competitors Full (3/3)</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-white dark:text-[#021A17]" />
                        <span>Add as Competitor ({competitorCount}/3)</span>
                      </>
                    )}
                  </button>
                )}

                {listing.url && (
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 rounded-lg bg-white dark:bg-[#131C29] border border-slate-200 dark:border-[#263244] hover:border-slate-300 dark:hover:border-[#36445A] text-slate-700 dark:text-[#F8FAFC] text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <span>View on Etsy</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 dark:text-[#64748B]" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleExportTxt}
                  className="h-8 px-3 rounded-lg bg-white dark:bg-[#131C29] border border-slate-200 dark:border-[#263244] hover:border-slate-300 dark:hover:border-[#36445A] text-slate-700 dark:text-[#F8FAFC] text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Export listing text summary"
                >
                  <FileText className="w-3 h-3 text-slate-400 dark:text-[#64748B]" />
                  <span>Export TXT</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="h-8 px-3 rounded-lg bg-white dark:bg-[#131C29] border border-slate-200 dark:border-[#263244] hover:border-slate-300 dark:hover:border-[#36445A] text-slate-700 dark:text-[#F8FAFC] text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Export raw JSON"
                >
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Navigation tabs inside downloader */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#263244] pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("images")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "images"
                      ? "bg-emerald-600 dark:bg-[#14B8A6] text-white dark:text-[#021A17] font-bold shadow-xs"
                      : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#131C29]"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Images ({normalizedImages.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("videos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "videos"
                      ? "bg-emerald-600 dark:bg-[#14B8A6] text-white dark:text-[#021A17] font-bold shadow-xs"
                      : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#131C29]"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Videos ({normalizedVideos.length})</span>
                  {normalizedVideos.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#14B8A6] animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("tags")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "tags"
                      ? "bg-emerald-600 dark:bg-[#14B8A6] text-white dark:text-[#021A17] font-bold shadow-xs"
                      : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#131C29]"
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>Tags ({(listing.tags || []).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === "info"
                      ? "bg-emerald-600 dark:bg-[#14B8A6] text-white dark:text-[#021A17] font-bold shadow-xs"
                      : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#131C29]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Title &amp; Description</span>
                </button>
              </div>

              {(activeTab === "images" || activeTab === "videos") &&
                (normalizedImages.length > 0 || normalizedVideos.length > 0) && (
                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-[#14B8A6] dark:hover:bg-[#2DD4BF] disabled:opacity-50 text-white dark:text-[#021A17] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white dark:text-[#021A17]" />
                        <span>{zipProgress || "Zipping..."}</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-3.5 h-3.5 text-white dark:text-[#021A17]" />
                        <span>
                          Download All ({normalizedImages.length} Photo{normalizedImages.length === 1 ? "" : "s"}
                          {normalizedVideos.length > 0
                            ? ` + ${normalizedVideos.length} Video${normalizedVideos.length === 1 ? "" : "s"}`
                            : ""}
                          )
                        </span>
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
                      className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer border border-black"
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
                            className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer shadow-sm border border-white/20"
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
                        className="h-9 px-3 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold cursor-pointer border border-black"
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

            {/* TAB: VIDEOS GALLERY */}
            {activeTab === "videos" && (
              <div className="space-y-4">
                {normalizedVideos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">
                        No videos detected on this listing
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                        Not all Etsy listings include a video. If this listing has a video on Etsy, ensure you use the <strong>⚡ Chrome Extension</strong> or <strong>Bookmarklet</strong> directly while viewing the listing on etsy.com to capture the full video stream URL.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-600">
                        Found <strong className="text-slate-900">{normalizedVideos.length}</strong> listing video{normalizedVideos.length > 1 ? "s" : ""}.
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadAllZip}
                        disabled={isZipping}
                        className="h-8 px-3 rounded-lg bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-black"
                      >
                        <FileArchive className="w-3.5 h-3.5" />
                        <span>Download All Media (.ZIP)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {normalizedVideos.map((vid, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-xs"
                        >
                          <div className="relative aspect-video bg-black flex items-center justify-center">
                            <video
                              controls
                              src={vid.url}
                              poster={vid.posterUrl}
                              className="w-full h-full object-contain"
                              preload="metadata"
                            />
                            <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                              Video #{idx + 1}
                            </span>
                          </div>
                          <div className="p-3 flex items-center justify-between gap-2 bg-white border-t border-slate-200">
                            <div className="text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">Format:</span>
                              <span className="uppercase font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                {vid.format || "MP4"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={vid.url}
                                target="_blank"
                                rel="noreferrer"
                                className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 transition cursor-pointer"
                              >
                                <span>Open URL</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDownloadSingleVideo(vid.url, idx)}
                                className="h-7 px-3 rounded-lg bg-black hover:bg-zinc-800 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition cursor-pointer shadow-xs border border-black"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download MP4</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <TagIcon className="w-5 h-5 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">
                        No tags attached yet for this listing
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Tags on Etsy can be lazy-loaded or hidden. You can auto-generate 13 high-intent SEO keyword tags directly from the title and description right now!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoGenerateTags}
                      className="px-3.5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer border border-black shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ Generate 13 Tags from Title & Description</span>
                    </button>
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
          <div className="flex-1 p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-slate-900">
                Enter an Etsy listing link above
              </h3>
              <p className="text-xs text-slate-500">
                Paste any live Etsy listing link or listing ID to inspect tags and download photos.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 w-full max-w-sm">
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-bold text-slate-900">Don&apos;t have an Etsy API key?</p>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Use our <strong>1-Click Bookmarklet</strong> to grab all HD photos &amp; all 13 tags straight from Etsy with zero API setup.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowBookmarklet(true)}
                    className="mt-1 text-xs text-amber-800 hover:text-amber-950 font-bold underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Bookmarklet Setup &amp; Drag Link</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );

  if (isPage) {
    return (
      <div className="w-full space-y-6">
        {mainView}
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
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {mainView}

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
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
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

export function ListingDownloaderView(props: Omit<ListingDownloaderModalProps, "isPage">) {
  return <ListingDownloaderModal {...props} isPage={true} isOpen={true} />;
}
