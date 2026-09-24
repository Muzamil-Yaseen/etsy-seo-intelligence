import fs from "fs";
import path from "path";
import { AdminSettings, DEFAULT_ADMIN_SETTINGS } from "./admin-settings";

// In-memory cache for serverless environments
let memoryAdminSettings: AdminSettings | null = null;

function getStoreFilePath(): string {
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isVercel) {
    return path.join("/tmp", "admin-settings.json");
  }
  return path.join(process.cwd(), "data", "admin-settings.json");
}

export function getServerAdminSettings(): AdminSettings {
  if (memoryAdminSettings) {
    return memoryAdminSettings;
  }

  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      memoryAdminSettings = {
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
      return memoryAdminSettings as AdminSettings;
    }
  } catch (err) {
    console.error("Failed to read server admin settings, using default:", err);
  }

  memoryAdminSettings = { ...DEFAULT_ADMIN_SETTINGS };
  return memoryAdminSettings;
}

export function updateServerAdminSettings(updates: Partial<AdminSettings>): AdminSettings {
  const current = getServerAdminSettings();
  const updated: AdminSettings = {
    ...current,
    ...updates,
    aiRules: {
      ...current.aiRules,
      ...(updates.aiRules || {}),
    },
    branding: {
      ...current.branding,
      ...(updates.branding || {}),
    },
  };

  memoryAdminSettings = updated;

  try {
    const filePath = getStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write server admin settings to file:", err);
  }

  return updated;
}
