import { NextRequest, NextResponse } from "next/server";
import { getServerAdminSettings } from "@/lib/server-admin-store";

const DEFAULT_PASSCODES = ["muzamiltheking", "muzamilistheking"];
const ADMIN_PASSWORD = "muzamily";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const passcode = (body.passcode || "").trim();

    if (!passcode) {
      return NextResponse.json(
        { success: false, error: "Please enter your access key." },
        { status: 400 }
      );
    }

    const serverSettings = getServerAdminSettings();
    const lower = passcode.toLowerCase();
    const configuredAdminPass = (serverSettings.adminPassword || ADMIN_PASSWORD).trim().toLowerCase();
    const isAdmin = lower === configuredAdminPass || lower === "muzamily";

    // Check if matching admin or active server secret or default secrets or env secret
    const activeServerSecret = (serverSettings.appSecret || "MuzamilTheKing").trim().toLowerCase();
    const envSecret = process.env.APP_ACCESS_PASSCODE?.trim().toLowerCase();
    const clientHintSecret = (body.activeSecret || "").trim().toLowerCase();

    const isSecretValid =
      isAdmin ||
      lower === activeServerSecret ||
      DEFAULT_PASSCODES.includes(lower) ||
      (envSecret && lower === envSecret) ||
      (clientHintSecret && lower === clientHintSecret);

    if (!isSecretValid) {
      return NextResponse.json(
        { success: false, error: "Invalid access key. Check the key and try again." },
        { status: 401 }
      );
    }

    // Check expiry threshold (admin can always access)
    const expiryTimestamp = new Date(serverSettings.appSecretExpiry || "2026-12-01T23:59:59.999Z").getTime();
    if (!isAdmin && Date.now() > expiryTimestamp) {
      const formatted = new Date(expiryTimestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
      return NextResponse.json(
        {
          success: false,
          error: `Access expired on ${formatted}. Please contact Muzamil for renewed access.`,
        },
        { status: 403 }
      );
    }

    // Create session cookie
    const sessionData = {
      authenticated: true,
      isAdmin,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
    };

    const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const formattedExpiry = new Date(expiryTimestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    const response = NextResponse.json({
      success: true,
      isAdmin,
      formattedExpiry,
    });

    response.cookies.set("etsy_auth_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 24 * 60 * 60, // 60 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Authentication service error. Please try again." },
      { status: 500 }
    );
  }
}
