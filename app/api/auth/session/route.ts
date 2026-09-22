import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("etsy_auth_session")?.value;

    if (!cookie) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const decoded = JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
      if (decoded.authenticated && Date.now() < (decoded.expiresAt || 0)) {
        return NextResponse.json({
          authenticated: true,
          isAdmin: Boolean(decoded.isAdmin),
          formattedExpiry: "Dec 1, 2026",
        });
      }
    } catch {}

    return NextResponse.json({ authenticated: false });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(req: NextRequest) {
  // Logout endpoint: clear session cookie
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("etsy_auth_session");
  return response;
}
