import { NextRequest, NextResponse } from "next/server";
import { forwardToBackend, withApiPrefix } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  const upstream = await forwardToBackend(request, withApiPrefix("/api/me"), { method: "GET" });

  if (!upstream.ok) {
    return NextResponse.json({ ok: false, error: "No active session" }, { status: 401 });
  }

  const payload = await upstream.json().catch(() => ({}));
  const user = payload?.user || payload?.data?.user || null;

  if (!user) {
    return NextResponse.json({ ok: false, error: "No active session" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Session exchange is not supported in this API" },
    { status: 405 }
  );
}
