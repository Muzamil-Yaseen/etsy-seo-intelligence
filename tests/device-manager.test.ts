import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_APP_SECRET,
  DEFAULT_SECRET_EXPIRY,
  verifySecretPasscode,
  getSecretValidityInfo,
  isAppSecretExpired,
  getRegisteredDevices,
  registerCurrentDevice,
  revokeDevice,
  revokeAllOtherDevices,
  deleteDevice,
  getConnectedAppsList,
  updateAppSecret,
  updateAppSecretExpiry,
  getCurrentDeviceId,
} from "../lib/device-manager";

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
  navigator: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  },
} as any;

describe("Device & App Management Service", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("Secret & Expiry Verification", () => {
    it("has default secret set to MuzamilTheKing", () => {
      expect(DEFAULT_APP_SECRET).toBe("MuzamilTheKing");
    });

    it("verifies the exact secret MuzamilTheKing successfully", () => {
      const res = verifySecretPasscode("MuzamilTheKing");
      expect(res.success).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("verifies the secret case-insensitively for user convenience", () => {
      const res = verifySecretPasscode("muzamiltheking");
      expect(res.success).toBe(true);
    });

    it("rejects an incorrect secret", () => {
      const res = verifySecretPasscode("WrongSecret123");
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("rejects an empty input", () => {
      const res = verifySecretPasscode("");
      expect(res.success).toBe(false);
      expect(res.error).toContain("enter your secret");
    });

    it("is not expired before 1st December 2026", () => {
      // 1st December 2026 is in the future
      const validity = getSecretValidityInfo();
      expect(validity.formattedExpiry).toMatch(/Dec(ember)? 1, 2026/);
      expect(validity.secret).toBe("MuzamilTheKing");
      expect(validity.isExpired).toBe(false);
      expect(validity.daysRemaining).toBeGreaterThan(0);
    });

    it("detects expired secrets when past expiration threshold", () => {
      // Set an expired date in the past
      updateAppSecretExpiry("2020-01-01T00:00:00Z");
      expect(isAppSecretExpired()).toBe(true);

      const res = verifySecretPasscode("MuzamilTheKing");
      expect(res.success).toBe(false);
      expect(res.error).toContain("expired");
    });

    it("allows updating the secret and custom expiry", () => {
      updateAppSecret("NewMuzamilSecret2026");
      const validity = getSecretValidityInfo();
      expect(validity.secret).toBe("NewMuzamilSecret2026");

      const res = verifySecretPasscode("NewMuzamilSecret2026");
      expect(res.success).toBe(true);
    });
  });

  describe("Device Registration & Revocation", () => {
    it("generates a persistent device ID for current client", () => {
      const id1 = getCurrentDeviceId();
      const id2 = getCurrentDeviceId();
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^dev_/);
    });

    it("registers the current device into authorized list", () => {
      const current = registerCurrentDevice("MuzamilTheKing");
      expect(current).toBeDefined();
      expect(current.status).toBe("active");
      expect(current.isCurrent).toBe(true);

      const list = getRegisteredDevices();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(current.id);
    });

    it("revokes a specific device and updates its status", () => {
      const current = registerCurrentDevice("MuzamilTheKing");
      const updated = revokeDevice(current.id);
      expect(updated[0].status).toBe("revoked");

      const devices = getRegisteredDevices();
      expect(devices[0].status).toBe("revoked");
    });

    it("revokes other devices while preserving current device", () => {
      // Seed two devices: current and simulated remote device
      const current = registerCurrentDevice("MuzamilTheKing");
      const remoteDevice = {
        id: "dev_remote_simulated",
        name: "MacBook • Safari",
        type: "desktop" as const,
        os: "macOS",
        browser: "Safari",
        firstAuthorized: Date.now() - 5000,
        lastActive: Date.now() - 5000,
        status: "active" as const,
        tokenUsed: "MuzamilTheKing",
      };

      localStorage.setItem(
        "etsy_registered_devices",
        JSON.stringify([current, remoteDevice])
      );

      const afterRevokeOthers = revokeAllOtherDevices();
      const currAfter = afterRevokeOthers.find((d) => d.id === current.id);
      const remoteAfter = afterRevokeOthers.find((d) => d.id === remoteDevice.id);

      expect(currAfter?.status).toBe("active");
      expect(remoteAfter?.status).toBe("revoked");
    });

    it("deletes a device record from the registered list", () => {
      const current = registerCurrentDevice("MuzamilTheKing");
      const updated = deleteDevice(current.id);
      expect(updated.length).toBe(0);
    });
  });

  describe("Connected Apps Inventory", () => {
    it("returns connected Chrome extension, Etsy API, Groq engine, and Bookmarklet", () => {
      const apps = getConnectedAppsList();
      expect(apps.length).toBeGreaterThanOrEqual(4);

      const extensionApp = apps.find((a) => a.id === "chrome_extension");
      expect(extensionApp).toBeDefined();
      expect(extensionApp?.status).toBe("connected");

      const groqApp = apps.find((a) => a.id === "groq_ai_engine");
      expect(groqApp).toBeDefined();

      const etsyApp = apps.find((a) => a.id === "etsy_official_api");
      expect(etsyApp).toBeDefined();
    });
  });
});
