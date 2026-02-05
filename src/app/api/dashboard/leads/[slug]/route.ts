import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TENANT_ID = "default";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, customer_phone, slug, answers, status, last_inbound_at, created_at")
    .eq("tenant_id", TENANT_ID)
    .eq("slug", params.slug)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, lead: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await getSupabaseServerClient();
  const { status, notes } = (await request.json()) as {
    status?: string;
    notes?: string;
  };

  if (!status) {
    return NextResponse.json(
      { ok: false, error: "Status is required" },
      { status: 400 }
    );
  }

  const { data: existing, error: fetchError } = await supabase
    .from("conversations")
    .select("id, answers")
    .eq("tenant_id", TENANT_ID)
    .eq("slug", params.slug)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { ok: false, error: fetchError.message },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  const answers = (existing.answers as Record<string, unknown>) || {};
  const nextAnswers = {
    ...answers,
    notes:
      notes ??
      (typeof answers.notes === "string" ? answers.notes : undefined) ??
      "",
  };

  const { error: updateError } = await supabase
    .from("conversations")
    .update({ status, answers: nextAnswers })
    .eq("id", existing.id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
