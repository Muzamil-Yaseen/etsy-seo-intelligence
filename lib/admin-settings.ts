/**
 * Master Admin Settings & Remote Control Service
 * Allows Muzamil to manage sessions, remote delete extension/API keys,
 * set custom AI rules, and customize site branding (logo, colors, header, footer).
 */

export interface AdminSettings {
  // Security & Passcodes
  appSecret: string;
  appSecretExpiry: string; // ISO string
  adminPassword: string;
  isGateEnabled: boolean;
  maxAllowedDevices: number;

  // Remote Delete & Extension Control
  extensionEnabled: boolean;
  extensionBridgeToken: string;

  // AI Rules & Guardrails
  aiRules: {
    systemPromptGuidelines: string;
    temperature: number;
    model: string;
    negativeKeywords: string[];
    enforce13Tags: boolean;
    tagCasing: "lowercase" | "original";
  };

  // Branding & Visual Styles
  branding: {
    appName: string;
    appSubtitle: string;
    logoUrl: string;
    accentColor: string; // hex color
    headerBadgeText: string;
    footerCredit: string;
    announcementBanner: {
      enabled: boolean;
      text: string;
    };
  };
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  appSecret: "MuzamilTheKing",
  appSecretExpiry: "2026-12-01T23:59:59.999Z", // 1st December 2026
  adminPassword: "muzamily",
  isGateEnabled: true,
  maxAllowedDevices: 10,

  extensionEnabled: true,
  extensionBridgeToken: "bridge_token_active_muzamil",

  aiRules: {
    systemPromptGuidelines:
      "Generate high-converting, strictly grounded Etsy listing titles and 13 tags based solely on verified product features and competitor evidence.",
    temperature: 0.2,
    model: "llama-3.3-70b-versatile",
    negativeKeywords: ["cheap", "replica", "fake", "guaranteed", "best seller"],
    enforce13Tags: true,
    tagCasing: "lowercase",
  },

  branding: {
    appName: "Etsy Intelligence",
    appSubtitle: "SEO & Competitor Intelligence Studio",
    logoUrl: "/logo-icon.png",
    accentColor: "#10B981", // Emerald
    headerBadgeText: "SEO & Market Studio",
    footerCredit: "Crafted & Managed by Muzamil",
    announcementBanner: {
      enabled: false,
      text: "⚡ Special Studio Announcement: 1-Click Etsy Intelligence Active",
    },
  },
};

const SETTINGS_STORAGE_KEY = "etsy_master_admin_settings";
const ADMIN_SESSION_KEY = "etsy_admin_authenticated";

/**
 * Retrieve current admin settings from localStorage or fallback to defaults
 */
export function getAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ADMIN_SETTINGS,
      ...parsed,
      aiRules: {
        ...DEFAULT_ADMIN_SETTINGS.aiRules,
        ...(parsed.aiRules || {}),
      },
      branding: {
        ...DEFAULT_ADMIN_SETTINGS.branding,
        ...(parsed.branding || {}),
      },
    };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

/**
 * Save updated admin settings to localStorage and notify listeners
 */
export function saveAdminSettings(settings: Partial<AdminSettings>): AdminSettings {
  const current = getAdminSettings();
  const updated: AdminSettings = {
    ...current,
    ...settings,
    aiRules: {
      ...current.aiRules,
      ...(settings.aiRules || {}),
    },
    branding: {
      ...current.branding,
      ...(settings.branding || {}),
    },
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("admin-settings-changed", { detail: updated }));
    } catch {}
  }
  return updated;
}

/**
 * Reset all settings back to default
 */
export function resetAdminSettings(): AdminSettings {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent("admin-settings-changed", { detail: DEFAULT_ADMIN_SETTINGS })
      );
    } catch {}
  }
  return DEFAULT_ADMIN_SETTINGS;
}

/**
 * Check if the admin password "muzamily" is correct
 */
export function verifyAdminPassword(input: string): boolean {
  const trimmed = (input || "").trim();
  const current = getAdminSettings();
  return (
    trimmed === current.adminPassword ||
    trimmed.toLowerCase() === "muzamily"
  );
}

/**
 * Set admin session state
 */
export function setAdminAuthenticated(authenticated: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (authenticated) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {}
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Remote Actions
 */

export function remoteDeleteExtensionBridge(): void {
  saveAdminSettings({
    extensionEnabled: false,
    extensionBridgeToken: `revoked_${Date.now()}`,
  });
}

export function remoteDeleteEtsyApiKey(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("etsy_user_api_key");
    } catch {}
  }
}

export function remoteDeleteGroqApiKey(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("groq_api_key");
    } catch {}
  }
}

export function remoteWipeAllSessions(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("etsy_registered_devices");
      localStorage.removeItem("verdana_access_token");
    } catch {}
  }
}

export function reauthorizeCurrentDevice(): void {
  if (typeof window !== "undefined") {
    try {
      const currentId = localStorage.getItem("etsy_current_device_id");
      const raw = localStorage.getItem("etsy_registered_devices");
      if (raw && currentId) {
        const list = JSON.parse(raw);
        const updated = list.map((d: any) =>
          d.id === currentId ? { ...d, status: "active" } : d
        );
        localStorage.setItem("etsy_registered_devices", JSON.stringify(updated));
      }
    } catch {}
  }
}
