import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://crm.ummahleads.app";

// Generate a slug from the user's name, ensuring uniqueness.
async function generateRefCode(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const raw =
    profile?.full_name ??
    email?.split("@")[0] ??
    "agent";

  const base = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 12) || "agent";

  for (let i = 0; i < 10; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const code = `${base}-${suffix}`;
    const { data } = await supabase
      .from("referral_links")
      .select("id")
      .eq("ref_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  // Final fallback — virtually never reached
  return `agent-${crypto.randomUUID().slice(0, 8)}`;
}

function withLinkUrl(link: Record<string, unknown>) {
  return { ...link, link_url: `${BASE_URL}/r/${link.ref_code}` };
}

// ─── GET — fetch (or auto-create) the caller's referral link ─────────────────
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("referral_links")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing) return NextResponse.json(withLinkUrl(existing));

  // First visit — create the link
  const ref_code = await generateRefCode(supabase, user.id, user.email);
  const { data: created, error } = await supabase
    .from("referral_links")
    .insert({ user_id: user.id, ref_code })
    .select()
    .single();

  if (error || !created)
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });

  return NextResponse.json(withLinkUrl(created), { status: 201 });
}

// ─── PATCH — update destination_url and/or ref_code ──────────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, string> = {};

  if (typeof body.destination_url === "string") {
    try {
      new URL(body.destination_url); // validate
      updates.destination_url = body.destination_url;
    } catch {
      return NextResponse.json(
        { error: "Invalid destination_url" },
        { status: 400 },
      );
    }
  }

  if (typeof body.ref_code === "string") {
    const clean = body.ref_code
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 30);
    if (clean.length < 3)
      return NextResponse.json(
        { error: "ref_code too short (min 3 chars)" },
        { status: 400 },
      );
    // Check uniqueness
    const { data: conflict } = await supabase
      .from("referral_links")
      .select("id")
      .eq("ref_code", clean)
      .neq("user_id", user.id)
      .maybeSingle();
    if (conflict)
      return NextResponse.json(
        { error: "That code is already taken" },
        { status: 409 },
      );
    updates.ref_code = clean;
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("referral_links")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !updated)
    return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json(withLinkUrl(updated));
}
