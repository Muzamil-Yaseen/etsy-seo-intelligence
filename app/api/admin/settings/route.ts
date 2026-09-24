import { NextRequest, NextResponse } from "next/server";
import { getServerAdminSettings, updateServerAdminSettings } from "@/lib/server-admin-store";

export async function GET(req: NextRequest) {
  try {
    const settings = getServerAdminSettings();
    return NextResponse.json({
      success: true,
      settings: {
        appSecret: settings.appSecret,
        appSecretExpiry: settings.appSecretExpiry,
        isGateEnabled: settings.isGateEnabled,
        maxAllowedDevices: settings.maxAllowedDevices,
        extensionEnabled: settings.extensionEnabled,
        extensionBridgeToken: settings.extensionBridgeToken,
        branding: settings.branding,
        aiRules: settings.aiRules,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve admin settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const updated = updateServerAdminSettings(body);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update admin settings" },
      { status: 500 }
    );
  }
}
