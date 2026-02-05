import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TENANT_ID = "default";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tenant_config")
    .select("tenant_id, bot_enabled, welcome_text, closing_text")
    .eq("tenant_id", TENANT_ID)
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const config = data ?? {
    tenant_id: TENANT_ID,
    bot_enabled: true,
    welcome_text: "",
    closing_text: "",
  };

  return NextResponse.json({ ok: true, config });
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { bot_enabled, welcome_text, closing_text } = (await request.json()) as {
    bot_enabled?: boolean;
    welcome_text?: string | null;
    closing_text?: string | null;
  };

  if (bot_enabled === undefined) {
    return NextResponse.json(
      { ok: false, error: "bot_enabled is required" },
      { status: 400 }
    );
  }

  const payload = {
    tenant_id: TENANT_ID,
    bot_enabled,
    welcome_text: welcome_text ?? "",
    closing_text: closing_text ?? "",
  };

  const { error } = await supabase.from("tenant_config").upsert(payload);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
