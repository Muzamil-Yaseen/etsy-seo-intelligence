import JSZip from "jszip";

export interface ListingDownloadInput {
  listingId?: string | number | null;
  title?: string | null;
  description?: string | null;
  price?: string | number | null;
  currency?: string | null;
  shopName?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  images?: Array<string | { url?: string; fullUrl?: string }> | null;
  videos?: Array<{ url: string; format?: string }> | string[] | null;
  videoUrl?: string | null;
  tags?: string[] | null;
  materials?: string[] | null;
  [key: string]: any;
}

/**
 * Converts Etsy image URL to maximum resolution (il_fullxfull)
 */
export function toFullResolutionUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (rawUrl.includes("etsystatic.com")) {
    return rawUrl.replace(/\/il_\d+x\w+\./, "/il_fullxfull.");
  }
  return rawUrl;
}

/**
 * Downloads binary image/video blob, falling back to proxy on CORS restriction
 */
export async function fetchMediaBlob(url: string): Promise<Blob> {
  if (!url) throw new Error("No URL provided");
  try {
    const directRes = await fetch(url, { mode: "cors" });
    if (directRes.ok) {
      return await directRes.blob();
    }
  } catch {
    // Direct fetch failed (likely localhost CORS or Etsy CDN header), fall back to proxy
  }

  const proxyRes = await fetch(`/api/proxy-media?url=${encodeURIComponent(url)}`);
  if (!proxyRes.ok) {
    throw new Error(`Media fetch failed: ${proxyRes.status} ${proxyRes.statusText}`);
  }
  return await proxyRes.blob();
}

/**
 * Formats 13 tags into a clean text document
 */
export function formatTagsText(tags: string[] | null = [], title?: string): string {
  const cleanTags = (tags || []).filter(Boolean);
  const lines: string[] = [
    "============================================================",
    `ETSY LISTING TAGS (${cleanTags.length} / 13)`,
    title ? `Listing: ${title}` : "",
    "============================================================",
    "",
    "TAGS LIST (Numbered):",
    ...cleanTags.map((tag, idx) => `${String(idx + 1).padStart(2, "0")}. ${tag} (${tag.length}/20 chars)`),
    "",
    "============================================================",
    "COMMA-SEPARATED (Ready to paste into Etsy Listing Manager):",
    cleanTags.join(", "),
    "============================================================",
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

/**
 * Formats title, description, price, and shop metadata into a text document
 */
export function formatListingText(listing: ListingDownloadInput): string {
  const tags = (listing.tags || []).filter(Boolean);
  const materials = (listing.materials || []).filter(Boolean);

  const lines: string[] = [
    "============================================================",
    "ETSY LISTING TITLE & DESCRIPTION",
    "============================================================",
    "",
    "LISTING TITLE:",
    listing.title || "Untitled Listing",
    "",
    `Character Count: ${(listing.title || "").length} / 140`,
    "",
    "------------------------------------------------------------",
    "LISTING DETAILS:",
    `Shop Name:    ${listing.shopName || "Unknown Shop"}`,
    `Listing ID:   ${listing.listingId || "N/A"}`,
    `Price:        $${listing.price || "0.00"} ${listing.currency || "USD"}`,
    `Listing URL:  ${listing.url || "N/A"}`,
    "",
    materials.length > 0 ? `Materials:    ${materials.join(", ")}` : "",
    tags.length > 0 ? `Tags Count:   ${tags.length}` : "",
    "------------------------------------------------------------",
    "",
    "FULL DESCRIPTION:",
    "============================================================",
    listing.description || "(No description provided for this listing)",
    "",
    "============================================================",
  ];

  return lines.filter((l) => l !== "").join("\n");
}

/**
 * Normalizes all listing images into full-resolution URL strings
 */
export function extractFullImageUrls(listing: ListingDownloadInput): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const addUrl = (raw: string | undefined | null) => {
    if (!raw || typeof raw !== "string") return;
    const full = toFullResolutionUrl(raw);
    if (full && !seen.has(full)) {
      seen.add(full);
      urls.push(full);
    }
  };

  if (Array.isArray(listing.images)) {
    for (const item of listing.images) {
      if (typeof item === "string") {
        addUrl(item);
      } else if (item && typeof item === "object") {
        addUrl(item.fullUrl || item.url);
      }
    }
  }

  if (listing.imageUrl) {
    addUrl(listing.imageUrl);
  }

  return urls;
}

/**
 * Normalizes video URLs
 */
export function extractVideoUrls(listing: ListingDownloadInput): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const addUrl = (raw: string | undefined | null) => {
    if (!raw || typeof raw !== "string") return;
    if (!seen.has(raw)) {
      seen.add(raw);
      urls.push(raw);
    }
  };

  if (Array.isArray(listing.videos)) {
    for (const item of listing.videos) {
      if (typeof item === "string") {
        addUrl(item);
      } else if (item && typeof item === "object") {
        addUrl(item.url);
      }
    }
  }

  if (listing.videoUrl) {
    addUrl(listing.videoUrl);
  }

  return urls;
}

/**
 * Automatically retrieves full listing details (all images, tags, description) if missing
 */
export async function ensureFullListingDetails(
  listing: ListingDownloadInput
): Promise<ListingDownloadInput> {
  const images = extractFullImageUrls(listing);
  const tags = listing.tags || [];
  const hasDescription = Boolean(listing.description && listing.description.trim().length > 20);

  // If already has rich multi-image and description data, use as-is
  if (images.length >= 2 && tags.length >= 5 && hasDescription) {
    return listing;
  }

  // Fetch full details from API
  const query = listing.url || String(listing.listingId || "");
  if (!query) return listing;

  try {
    let apiKey = "";
    if (typeof window !== "undefined") {
      try {
        apiKey = localStorage.getItem("etsy_user_api_key") || "";
      } catch {}
    }

    const res = await fetch("/api/fetch-listing-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-etsy-api-key": apiKey.trim() } : {}),
      },
      body: JSON.stringify({ url: query }),
    });

    const data = await res.json();
    if (data.success && data.listing) {
      return {
        ...listing,
        listingId: data.listing.listingId || listing.listingId,
        title: data.listing.title || listing.title,
        description: data.listing.description || listing.description,
        price: data.listing.price || listing.price,
        currency: data.listing.currency || listing.currency,
        shopName: data.listing.shopName || listing.shopName,
        url: data.listing.url || listing.url,
        images: data.listing.images || listing.images,
        imageUrl: data.listing.imageUrl || listing.imageUrl,
        videos: data.listing.videos || listing.videos,
        videoUrl: data.listing.videoUrl || listing.videoUrl,
        tags: data.listing.tags || listing.tags,
        materials: data.listing.materials || listing.materials,
      };
    }
  } catch (e) {
    console.warn("Could not enrich listing details for download:", e);
  }

  return listing;
}

/**
 * Packages a single listing into a specified JSZip folder with:
 * - images/ folder
 * - videos/ folder (if any)
 * - tags.txt
 * - title-description.txt
 * - listing.json
 */
export async function packageListingIntoFolder(
  targetFolder: JSZip,
  rawListing: ListingDownloadInput,
  itemPrefix = "",
  onProgress?: (msg: string) => void
): Promise<{ photosCount: number; videosCount: number }> {
  const listing = await ensureFullListingDetails(rawListing);
  const imageUrls = extractFullImageUrls(listing);
  const videoUrls = extractVideoUrls(listing);
  const tags = (listing.tags || []).filter(Boolean);

  let photosCount = 0;
  let videosCount = 0;

  // 1. Create images folder and download all photos
  if (imageUrls.length > 0) {
    const imagesFolder = targetFolder.folder("images");
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      if (onProgress) {
        onProgress(`${itemPrefix}Downloading photo ${i + 1} of ${imageUrls.length}...`);
      }
      try {
        const blob = await fetchMediaBlob(url);
        imagesFolder?.file(`photo-${String(i + 1).padStart(2, "0")}.jpg`, blob);
        photosCount++;
      } catch (err) {
        console.warn(`Failed downloading image ${url}:`, err);
      }
    }
  }

  // 2. Create videos folder and download all videos (if any exist)
  if (videoUrls.length > 0) {
    const videosFolder = targetFolder.folder("videos");
    for (let v = 0; v < videoUrls.length; v++) {
      const url = videoUrls[v];
      if (onProgress) {
        onProgress(`${itemPrefix}Downloading video ${v + 1} of ${videoUrls.length}...`);
      }
      try {
        const blob = await fetchMediaBlob(url);
        videosFolder?.file(`video-${String(v + 1).padStart(2, "0")}.mp4`, blob);
        videosCount++;
      } catch (err) {
        console.warn(`Failed downloading video ${url}:`, err);
      }
    }
  }

  // 3. Add tags.txt
  const tagsContent = formatTagsText(tags, listing.title || undefined);
  targetFolder.file("tags.txt", tagsContent);

  // 4. Add title-description.txt
  const textContent = formatListingText(listing);
  targetFolder.file("title-description.txt", textContent);

  // 5. Add listing.json
  const jsonContent = JSON.stringify(
    {
      listingId: listing.listingId || null,
      title: listing.title || "",
      description: listing.description || "",
      price: listing.price || null,
      currency: listing.currency || "USD",
      shopName: listing.shopName || "",
      url: listing.url || "",
      materials: listing.materials || [],
      tagsCount: tags.length,
      tags,
      imagesCount: photosCount || imageUrls.length,
      images: imageUrls,
      videosCount: videosCount || videoUrls.length,
      videos: videoUrls,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
  targetFolder.file("listing.json", jsonContent);

  return { photosCount, videosCount };
}

/**
 * Downloads a single listing as a ZIP with images, videos, tags, title & description in folder of images, text, and json
 */
export async function downloadSingleListingZip(
  listing: ListingDownloadInput,
  onProgress?: (msg: string) => void
): Promise<void> {
  const zip = new JSZip();
  const cleanShop = (listing.shopName || "etsy").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 15);
  const idStr = String(listing.listingId || "item");
  const folderName = `etsy-listing-${idStr}-${cleanShop}`;

  if (onProgress) onProgress("Preparing listing download package...");
  await packageListingIntoFolder(zip, listing, "", onProgress);

  if (onProgress) onProgress("Compressing files into ZIP...");
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const blobUrl = URL.createObjectURL(zipBlob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);

  if (onProgress) onProgress("");
}

/**
 * Downloads all competitor listings together in a master ZIP, with a dedicated subfolder for each listing
 * containing images/, videos/, tags.txt, title-description.txt, and listing.json
 */
export async function downloadMultipleListingsZip(
  listings: ListingDownloadInput[],
  zipFilename = "etsy-competitors-all-listings-assets.zip",
  onProgress?: (msg: string) => void
): Promise<void> {
  if (!listings || listings.length === 0) return;

  const zip = new JSZip();
  const allJsonSummaries: any[] = [];
  const allCollectedTags = new Set<string>();

  for (let idx = 0; idx < listings.length; idx++) {
    const raw = listings[idx];
    const cleanTitle = (raw.title || `item-${idx + 1}`)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
    const subfolderName = `Listing-${idx + 1}-${raw.listingId || "id"}-${cleanTitle}`;
    const subFolder = zip.folder(subfolderName);

    if (subFolder) {
      const prefix = `[Listing ${idx + 1}/${listings.length}] `;
      if (onProgress) onProgress(`${prefix}Preparing assets...`);

      const enriched = await ensureFullListingDetails(raw);
      await packageListingIntoFolder(subFolder, enriched, prefix, onProgress);

      const tags = (enriched.tags || []).filter(Boolean);
      tags.forEach((t) => allCollectedTags.add(t));

      allJsonSummaries.push({
        index: idx + 1,
        listingId: enriched.listingId || null,
        title: enriched.title || "",
        price: enriched.price || null,
        currency: enriched.currency || "USD",
        shopName: enriched.shopName || "",
        url: enriched.url || "",
        tagsCount: tags.length,
        tags,
        imagesCount: extractFullImageUrls(enriched).length,
        descriptionSnippet: (enriched.description || "").slice(0, 200),
      });
    }
  }

  // Add root summary JSON and combined tags file
  zip.file(
    "all-competitors.json",
    JSON.stringify(
      {
        totalListings: listings.length,
        exportedAt: new Date().toISOString(),
        competitors: allJsonSummaries,
      },
      null,
      2
    )
  );

  const allTagsList = Array.from(allCollectedTags);
  zip.file(
    "all-competitor-tags.txt",
    [
      `COMBINED UNIQUE TAGS (${allTagsList.length} total across ${listings.length} competitors)`,
      "============================================================",
      ...allTagsList.map((t, i) => `${String(i + 1).padStart(2, "0")}. ${t}`),
      "",
      "============================================================",
      "COMMA-SEPARATED ALL TAGS:",
      allTagsList.join(", "),
    ].join("\n")
  );

  if (onProgress) onProgress("Compressing all listings into master ZIP...");
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const blobUrl = URL.createObjectURL(zipBlob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);

  if (onProgress) onProgress("");
}
