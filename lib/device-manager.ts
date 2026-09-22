/**
 * Device & Connected App Management Service
 * Handles multi-device tracking, remote revocation, app integration statuses,
 * and time-bounded app secret verification (valid till 1st December 2026).
 */

export interface DeviceSession {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
  firstAuthorized: number;
  lastActive: number;
  status: "active" | "revoked";
  tokenUsed: string;
  isCurrent?: boolean;
}

export interface ConnectedApp {
  id: string;
  name: string;
  category: "browser_extension" | "marketplace_api" | "ai_model" | "script";
  status: "connected" | "disconnected" | "ready";
  version?: string;
  description: string;
  lastUsed?: string;
  apiKeyPreview?: string;
}

export const DEFAULT_APP_SECRET = "MuzamilTheKing";
export const DEFAULT_SECRET_EXPIRY = "2026-12-01T23:59:59.999Z"; // 1st December 2026

const STORAGE_KEY_DEVICES = "etsy_registered_devices";
const STORAGE_KEY_DEVICE_ID = "etsy_current_device_id";
const STORAGE_KEY_SECRET = "etsy_custom_app_secret";
const STORAGE_KEY_EXPIRY = "etsy_custom_app_secret_expiry";

/**
 * Parses user-agent to extract OS, browser, and device form factor
 */
export function detectDeviceDetails(): {
  name: string;
  type: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
} {
  if (typeof window === "undefined" || !window.navigator) {
    return {
      name: "Desktop Browser",
      type: "desktop",
      os: "Unknown OS",
      browser: "Unknown Browser",
    };
  }

  const ua = window.navigator.userAgent || "";
  let os = "Unknown OS";
  let browser = "Unknown Browser";
  let type: "desktop" | "mobile" | "tablet" = "desktop";

  // Detect OS
  if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt/i.test(ua)) os = "Windows PC";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/iphone/i.test(ua)) {
    os = "iOS (iPhone)";
    type = "mobile";
  } else if (/ipad/i.test(ua)) {
    os = "iPadOS";
    type = "tablet";
  } else if (/android/i.test(ua)) {
    os = "Android";
    type = /tablet|nexus 7|nexus 9|nexus 10/i.test(ua) ? "tablet" : "mobile";
  } else if (/linux/i.test(ua)) os = "Linux";

  // Detect Browser
  if (/edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Mozilla Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Apple Safari";
  else if (/opera|opr\//i.test(ua)) browser = "Opera";

  const name = `${os} • ${browser}`;
  return { name, type, os, browser };
}

/**
 * Returns or generates a persistent device ID for this client
 */
export function getCurrentDeviceId(): string {
  if (typeof window === "undefined") return "dev_server";
  try {
    let id = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!id) {
      id = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, id);
    }
    return id;
  } catch {
    return "dev_fallback";
  }
}

/**
 * Get the currently configured app secret
 */
export function getActiveAppSecret(): string {
  if (typeof window === "undefined") return DEFAULT_APP_SECRET;
  try {
    const envPass = process.env.NEXT_PUBLIC_APP_ACCESS_PASSCODE?.trim();
    if (envPass) return envPass;
    const custom = localStorage.getItem(STORAGE_KEY_SECRET)?.trim();
    if (custom) return custom;
    const adminRaw = localStorage.getItem("etsy_master_admin_settings");
    if (adminRaw) {
      const parsed = JSON.parse(adminRaw);
      if (parsed.appSecret?.trim()) return parsed.appSecret.trim();
    }
  } catch {}
  return DEFAULT_APP_SECRET;
}

/**
 * Get the expiration timestamp for the app secret
 */
export function getAppSecretExpiry(): number {
  if (typeof window === "undefined") return new Date(DEFAULT_SECRET_EXPIRY).getTime();
  try {
    const custom = localStorage.getItem(STORAGE_KEY_EXPIRY);
    if (custom) {
      const parsed = Number(custom);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const adminRaw = localStorage.getItem("etsy_master_admin_settings");
    if (adminRaw) {
      const parsed = JSON.parse(adminRaw);
      if (parsed.appSecretExpiry) {
        const parsedTime = new Date(parsed.appSecretExpiry).getTime();
        if (!isNaN(parsedTime) && parsedTime > 0) return parsedTime;
      }
    }
  } catch {}
  return new Date(DEFAULT_SECRET_EXPIRY).getTime();
}

/**
 * Checks if the app secret has passed the 1st December expiry threshold
 */
export function isAppSecretExpired(): boolean {
  const expiry = getAppSecretExpiry();
  return Date.now() > expiry;
}

/**
 * Returns formatted details about the secret validity
 */
export function getSecretValidityInfo() {
  const secret = getActiveAppSecret();
  const expiry = getAppSecretExpiry();
  const now = Date.now();
  const isExpired = now > expiry;
  const diffMs = expiry - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const expiryDateObj = new Date(expiry);
  const formattedExpiry = expiryDateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    secret,
    expiry,
    formattedExpiry,
    isExpired,
    daysRemaining,
  };
}

/**
 * Verifies if entered passcode matches and is not expired
 */
export function verifySecretPasscode(input: string): {
  success: boolean;
  error?: string;
} {
  const trimmed = (input || "").trim();
  if (!trimmed) {
    return { success: false, error: "Please enter your secret access key." };
  }

  const activeSecret = getActiveAppSecret();

  // Check if expired
  if (isAppSecretExpired()) {
    const { formattedExpiry } = getSecretValidityInfo();
    return {
      success: false,
      error: `This access key expired on ${formattedExpiry}. Please contact Muzamil for renewed access.`,
    };
  }

  // Case-insensitive match for ease of use
  if (trimmed.toLowerCase() === activeSecret.toLowerCase()) {
    return { success: true };
  }

  return {
    success: false,
    error: "Incorrect secret access key. Please verify your credentials.",
  };
}

/**
 * Retrieves all registered devices from localStorage
 */
export function getRegisteredDevices(): DeviceSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEVICES);
    if (!raw) return [];
    const currentId = getCurrentDeviceId();
    const list: DeviceSession[] = JSON.parse(raw);
    return list.map((dev) => ({
      ...dev,
      isCurrent: dev.id === currentId,
    }));
  } catch {
    return [];
  }
}

/**
 * Registers or updates this device session in localStorage
 */
export function registerCurrentDevice(secretToken: string = DEFAULT_APP_SECRET): DeviceSession {
  const currentId = getCurrentDeviceId();
  const details = detectDeviceDetails();
  const now = Date.now();

  const devices = getRegisteredDevices();
  const existingIdx = devices.findIndex((d) => d.id === currentId);

  let currentDev: DeviceSession;
  if (existingIdx !== -1) {
    currentDev = {
      ...devices[existingIdx],
      name: details.name,
      type: details.type,
      os: details.os,
      browser: details.browser,
      lastActive: now,
      tokenUsed: secretToken,
      status: devices[existingIdx].status === "revoked" ? "revoked" : "active",
      isCurrent: true,
    };
    devices[existingIdx] = currentDev;
  } else {
    currentDev = {
      id: currentId,
      name: details.name,
      type: details.type,
      os: details.os,
      browser: details.browser,
      firstAuthorized: now,
      lastActive: now,
      status: "active",
      tokenUsed: secretToken,
      isCurrent: true,
    };
    devices.unshift(currentDev);
  }

  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devices));
  } catch {}

  return currentDev;
}

/**
 * Checks if the current client device has been revoked
 */
export function isCurrentDeviceRevoked(): boolean {
  if (typeof window === "undefined") return false;
  const currentId = getCurrentDeviceId();
  const devices = getRegisteredDevices();
  const current = devices.find((d) => d.id === currentId);
  return Boolean(current && current.status === "revoked");
}

/**
 * Revokes a specific device by ID
 */
export function revokeDevice(deviceId: string): DeviceSession[] {
  if (typeof window === "undefined") return [];
  const devices = getRegisteredDevices();
  const updated = devices.map((d) => (d.id === deviceId ? { ...d, status: "revoked" as const } : d));
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(updated));
    // If current device was revoked, clear access token
    if (deviceId === getCurrentDeviceId()) {
      localStorage.removeItem("verdana_access_token");
    }
  } catch {}
  return updated;
}

/**
 * Removes a device record from the registered list
 */
export function deleteDevice(deviceId: string): DeviceSession[] {
  if (typeof window === "undefined") return [];
  const devices = getRegisteredDevices();
  const updated = devices.filter((d) => d.id !== deviceId);
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Revokes all other devices except this current client
 */
export function revokeAllOtherDevices(): DeviceSession[] {
  if (typeof window === "undefined") return [];
  const currentId = getCurrentDeviceId();
  const devices = getRegisteredDevices();
  const updated = devices.map((d) => (d.id === currentId ? d : { ...d, status: "revoked" as const }));
  try {
    localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Allows admin to update the active app secret
 */
export function updateAppSecret(newSecret: string): boolean {
  if (typeof window === "undefined") return false;
  const clean = (newSecret || "").trim();
  if (!clean) return false;
  try {
    localStorage.setItem(STORAGE_KEY_SECRET, clean);
    return true;
  } catch {
    return false;
  }
}

/**
 * Allows admin to update the app secret expiration date
 */
export function updateAppSecretExpiry(newExpiryDate: string | number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const timestamp = typeof newExpiryDate === "number" ? newExpiryDate : new Date(newExpiryDate).getTime();
    if (isNaN(timestamp) || timestamp <= 0) return false;
    localStorage.setItem(STORAGE_KEY_EXPIRY, String(timestamp));
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns connected apps and tool status for dashboard management
 */
export function getConnectedAppsList(): ConnectedApp[] {
  let etsyApiKey = "";
  let groqApiKey = "";

  if (typeof window !== "undefined") {
    try {
      etsyApiKey = localStorage.getItem("etsy_user_api_key") || "";
      groqApiKey = localStorage.getItem("groq_api_key") || "";
    } catch {}
  }

  return [
    {
      id: "chrome_extension",
      name: "Etsy Intelligence Chrome Extension",
      category: "browser_extension",
      status: "connected",
      version: "1.2.0",
      description: "Direct DOM extractor for HD photos, tags, videos & competitor queueing on etsy.com.",
      lastUsed: "Active on localhost:3001 & production",
    },
    {
      id: "etsy_official_api",
      name: "Etsy Open API v3",
      category: "marketplace_api",
      status: etsyApiKey ? "connected" : "ready",
      description: "Official Etsy developer key for high-throughput listing metadata & shop stats.",
      apiKeyPreview: etsyApiKey ? `${etsyApiKey.substring(0, 6)}••••••••` : "Not configured (Optional)",
    },
    {
      id: "groq_ai_engine",
      name: "Groq Cloud Llama-3 AI Engine",
      category: "ai_model",
      status: groqApiKey ? "connected" : "connected",
      description: "Ultra-fast Llama-3.3-70B model for deterministic titles, 13 tags, and semantic search queries.",
      apiKeyPreview: groqApiKey ? `${groqApiKey.substring(0, 6)}••••••••` : "Using server environment key",
    },
    {
      id: "bookmarklet_console",
      name: "1-Click Browser Bookmarklet",
      category: "script",
      status: "ready",
      version: "1.0",
      description: "Zero-installation JavaScript snippet for extracting listings on restricted browsers.",
    },
  ];
}
