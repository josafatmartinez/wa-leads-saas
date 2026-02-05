import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TENANT_ID = "default";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, customer_phone, slug, answers, status, handoff_to_human, updated_at"
    )
    .eq("tenant_id", TENANT_ID)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, leads: data ?? [] });
}
