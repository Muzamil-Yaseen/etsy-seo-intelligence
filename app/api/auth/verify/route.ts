import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PASSCODES = ["muzamiltheking", "muzamilistheking"];
const ADMIN_PASSWORD = "muzamily";
const DEFAULT_EXPIRY_MS = new Date("2026-12-01T23:59:59.999Z").getTime();

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

    const lower = passcode.toLowerCase();
    const isAdmin = lower === ADMIN_PASSWORD;

    // Check if matching admin or default secrets or env secret
    const envSecret = process.env.APP_ACCESS_PASSCODE?.trim().toLowerCase();
    const isSecretValid =
      isAdmin ||
      DEFAULT_PASSCODES.includes(lower) ||
      (envSecret && lower === envSecret);

    if (!isSecretValid) {
      return NextResponse.json(
        { success: false, error: "Invalid access key. Check the key and try again." },
        { status: 401 }
      );
    }

    // Check expiry threshold (admin can always access)
    if (!isAdmin && Date.now() > DEFAULT_EXPIRY_MS) {
      return NextResponse.json(
        {
          success: false,
          error: "Access expired on Dec 1, 2026. Please contact Muzamil for renewed access.",
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

    const response = NextResponse.json({
      success: true,
      isAdmin,
      formattedExpiry: "Dec 1, 2026",
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
