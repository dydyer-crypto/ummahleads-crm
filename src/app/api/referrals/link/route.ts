import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://crm.ummahleads.app";

function withUrl(link: Record<string, unknown>) {
  return { ...link, link_url: `${BASE_URL}/r/${link.ref_code}` };
}

async function generateUniqueCode(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null,
  suffix?: string,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const raw =
    profile?.full_name ?? email?.split("@")[0] ?? "agent";
  const base =
    (suffix
      ? `${raw}-${suffix}`
      : raw
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 20) || "agent";

  for (let i = 0; i < 10; i++) {
    const rand = Math.random().toString(36).slice(2, 6);
    const code = `${base}-${rand}`;
    const { data } = await supabase
      .from("referral_links")
      .select("id")
      .eq("ref_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  return `agent-${crypto.randomUUID().slice(0, 8)}`;
}

// ─── GET — list all campaigns for the current user ────────────────────────────
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: links } = await supabase
    .from("referral_links")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!links || links.length === 0) {
    // Auto-create default campaign on first visit
    const ref_code = await generateUniqueCode(supabase, user.id, user.email);
    const { data: created } = await supabase
      .from("referral_links")
      .insert({ user_id: user.id, ref_code, campaign_name: "Default" })
      .select()
      .single();
    return NextResponse.json(created ? [withUrl(created)] : [], { status: 201 });
  }

  return NextResponse.json(links.map(withUrl));
}

// ─── POST — create a new campaign link ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const campaign_name: string = body.campaign_name?.trim() || "Campaign";

  let destination_url = "https://ummahleads.app";
  if (typeof body.destination_url === "string") {
    try { new URL(body.destination_url); destination_url = body.destination_url; }
    catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  }

  // Slugify campaign name as code suffix
  const slug = campaign_name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 12);

  const ref_code = await generateUniqueCode(supabase, user.id, user.email, slug);

  const { data, error } = await supabase
    .from("referral_links")
    .insert({ user_id: user.id, ref_code, campaign_name, destination_url })
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json(withUrl(data), { status: 201 });
}
