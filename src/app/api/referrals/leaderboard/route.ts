import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all links + profiles
  const { data: links } = await supabase
    .from("referral_links")
    .select("id, user_id, ref_code")
    .eq("is_active", true);

  if (!links || links.length === 0) return NextResponse.json([]);

  const linkIds = links.map((l) => l.id);
  const userIds = [...new Set(links.map((l) => l.user_id))];

  const [profilesRes, clicksRes, commissionsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds),
    supabase.from("referral_clicks").select("link_id").in("link_id", linkIds),
    supabase.from("referral_commissions")
      .select("ref_code, commission_amount, status")
      .in("ref_code", links.map((l) => l.ref_code))
      .neq("status", "cancelled"),
  ]);

  // Aggregate clicks per user
  const clicksByLink: Record<string, number> = {};
  for (const c of clicksRes.data ?? []) {
    clicksByLink[c.link_id] = (clicksByLink[c.link_id] ?? 0) + 1;
  }

  const clicksByUser: Record<string, number> = {};
  for (const l of links) {
    clicksByUser[l.user_id] =
      (clicksByUser[l.user_id] ?? 0) + (clicksByLink[l.id] ?? 0);
  }

  // Aggregate commissions per ref_code → user
  const refCodeToUser = Object.fromEntries(links.map((l) => [l.ref_code, l.user_id]));
  const commissionsByUser: Record<string, { count: number; amount: number }> = {};
  for (const c of commissionsRes.data ?? []) {
    const uid = refCodeToUser[c.ref_code];
    if (!uid) continue;
    if (!commissionsByUser[uid]) commissionsByUser[uid] = { count: 0, amount: 0 };
    commissionsByUser[uid].count++;
    commissionsByUser[uid].amount += c.commission_amount ?? 0;
  }

  const profileMap = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p]),
  );

  const board = userIds
    .map((uid) => ({
      user_id: uid,
      full_name: profileMap[uid]?.full_name ?? "Agent",
      avatar_url: profileMap[uid]?.avatar_url ?? null,
      total_clicks: clicksByUser[uid] ?? 0,
      commissions_count: commissionsByUser[uid]?.count ?? 0,
      commissions_amount: commissionsByUser[uid]?.amount ?? 0,
      is_me: uid === user.id,
    }))
    .filter((r) => r.total_clicks > 0)
    .sort((a, b) => b.total_clicks - a.total_clicks)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return NextResponse.json(board);
}
