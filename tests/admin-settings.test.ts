import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_ADMIN_SETTINGS,
  getAdminSettings,
  saveAdminSettings,
  resetAdminSettings,
  verifyAdminPassword,
  remoteDeleteExtensionBridge,
  remoteDeleteEtsyApiKey,
  remoteDeleteGroqApiKey,
  remoteWipeAllSessions,
  reauthorizeCurrentDevice,
} from "../lib/admin-settings";
import { getActiveAppSecret, getAppSecretExpiry } from "../lib/device-manager";

const storageStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storageStore[key] ?? null,
  setItem: (key: string, value: string) => {
    storageStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storageStore[key];
  },
  clear: () => {
    for (const k in storageStore) delete storageStore[k];
  },
};

globalThis.localStorage = mockLocalStorage as any;
globalThis.window = {
  dispatchEvent: () => true,
  navigator: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
  },
} as any;

describe("Master Admin Settings & Remote Control Service", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("loads defaults with secret MuzamilTheKing and admin password muzamily", () => {
    const s = getAdminSettings();
    expect(s.appSecret).toBe("MuzamilTheKing");
    expect(s.adminPassword).toBe("muzamily");
    expect(s.appSecretExpiry).toContain("2026-12-01");
    expect(s.branding.appName).toBe("Etsy Intelligence");
  });

  it("verifies admin password muzamily correctly (case-insensitive)", () => {
    expect(verifyAdminPassword("muzamily")).toBe(true);
    expect(verifyAdminPassword("MUZAMILY")).toBe(true);
    expect(verifyAdminPassword("Muzamily")).toBe(true);
    expect(verifyAdminPassword("wrongPassword")).toBe(false);
  });

  it("saves updated admin settings and syncs with getActiveAppSecret", () => {
    saveAdminSettings({
      appSecret: "NewSecret2026",
      branding: {
        ...DEFAULT_ADMIN_SETTINGS.branding,
        appName: "Custom Etsy Intelligence",
      },
    });

    const current = getAdminSettings();
    expect(current.appSecret).toBe("NewSecret2026");
    expect(current.branding.appName).toBe("Custom Etsy Intelligence");
    expect(getActiveAppSecret()).toBe("NewSecret2026");
  });

  it("remotely deletes Chrome extension bridge", () => {
    remoteDeleteExtensionBridge();
    const current = getAdminSettings();
    expect(current.extensionEnabled).toBe(false);
    expect(current.extensionBridgeToken).toContain("revoked_");
  });

  it("remotely wipes Etsy and Groq API keys", () => {
    localStorage.setItem("etsy_user_api_key", "test_key_123");
    localStorage.setItem("groq_api_key", "gsk_test_456");

    remoteDeleteEtsyApiKey();
    expect(localStorage.getItem("etsy_user_api_key")).toBeNull();

    remoteDeleteGroqApiKey();
    expect(localStorage.getItem("groq_api_key")).toBeNull();
  });

  it("remotely wipes all client sessions", () => {
    localStorage.setItem("etsy_registered_devices", JSON.stringify([{ id: "dev1" }]));
    localStorage.setItem("verdana_access_token", JSON.stringify({ token: "MuzamilTheKing" }));

    remoteWipeAllSessions();
    expect(localStorage.getItem("etsy_registered_devices")).toBeNull();
    expect(localStorage.getItem("verdana_access_token")).toBeNull();
  });

  it("reauthorizes a previously revoked current device", () => {
    localStorage.setItem("etsy_current_device_id", "my_browser_id");
    localStorage.setItem(
      "etsy_registered_devices",
      JSON.stringify([{ id: "my_browser_id", status: "revoked" }])
    );

    reauthorizeCurrentDevice();
    const updated = JSON.parse(localStorage.getItem("etsy_registered_devices") || "[]");
    expect(updated[0].status).toBe("active");
  });

  it("resets all admin settings back to factory defaults", () => {
    saveAdminSettings({ appSecret: "Changed" });
    expect(getAdminSettings().appSecret).toBe("Changed");

    resetAdminSettings();
    expect(getAdminSettings().appSecret).toBe("MuzamilTheKing");
  });
});
