import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://crm.ummahleads.app";

type Ctx = { params: Promise<{ id: string }> };

// ─── PATCH — update campaign_name, ref_code or destination_url ───────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if (typeof body.campaign_name === "string" && body.campaign_name.trim())
    updates.campaign_name = body.campaign_name.trim().slice(0, 60);

  if (typeof body.destination_url === "string") {
    try { new URL(body.destination_url); updates.destination_url = body.destination_url; }
    catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  }

  if (typeof body.ref_code === "string") {
    const clean = body.ref_code.toLowerCase()
      .replace(/[^a-z0-9-]/g, "-").replace(/(^-|-$)/g, "").slice(0, 30);
    if (clean.length < 3)
      return NextResponse.json({ error: "ref_code too short" }, { status: 400 });
    const { data: conflict } = await supabase
      .from("referral_links").select("id")
      .eq("ref_code", clean).neq("id", id).maybeSingle();
    if (conflict)
      return NextResponse.json({ error: "Code already taken" }, { status: 409 });
    updates.ref_code = clean;
  }

  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("referral_links")
    .update(updates).eq("id", id).eq("user_id", user.id)
    .select().single();

  if (error || !data)
    return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ ...data, link_url: `${BASE_URL}/r/${data.ref_code}` });
}

// ─── DELETE — remove a campaign link ─────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("referral_links").delete().eq("id", id).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
