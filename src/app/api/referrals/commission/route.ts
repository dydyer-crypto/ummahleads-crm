import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_RATE = 0.10; // 10%

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { deal_id, ref_code, deal_value = 0, deal_title = "" } = body;

  if (!deal_id || !ref_code)
    return NextResponse.json({ error: "deal_id and ref_code required" }, { status: 400 });

  // Verify the ref_code belongs to this user
  const { data: link } = await supabase
    .from("referral_links").select("id")
    .eq("ref_code", ref_code).eq("user_id", user.id).maybeSingle();

  if (!link)
    return NextResponse.json({ error: "Link not found" }, { status: 404 });

  // Avoid duplicate commissions for the same deal
  const { data: existing } = await supabase
    .from("referral_commissions").select("id")
    .eq("deal_id", deal_id).maybeSingle();
  if (existing)
    return NextResponse.json({ error: "Commission already recorded" }, { status: 409 });

  const commission_amount = parseFloat(deal_value) * DEFAULT_RATE;

  const { data, error } = await supabase
    .from("referral_commissions")
    .insert({
      ref_code,
      link_id: link.id,
      deal_id,
      deal_title,
      deal_value: parseFloat(deal_value),
      commission_rate: DEFAULT_RATE,
      commission_amount,
    })
    .select()
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });

  // Optional: fire n8n webhook if configured
  const webhookUrl = process.env.N8N_REFERRAL_COMMISSION_WEBHOOK;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref_code,
        deal_title,
        deal_value,
        commission_amount,
        commission_id: data.id,
      }),
    }).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}
