import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all of the user's links
  const { data: links } = await supabase
    .from("referral_links").select("id, ref_code").eq("user_id", user.id);

  if (!links || links.length === 0) {
    return NextResponse.json({
      aggregate: { total: 0, month: 0, today: 0, commissions_count: 0, commissions_amount: 0 },
      by_link: {},
      chart: buildEmptyChart(),
    });
  }

  const linkIds = links.map((l) => l.id);
  const refCodes = links.map((l) => l.ref_code);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const chartStart = new Date(now);
  chartStart.setUTCDate(chartStart.getUTCDate() - 13);
  chartStart.setUTCHours(0, 0, 0, 0);

  const [allClicks, monthClicks, todayClicks, chartClicks, commissions] =
    await Promise.all([
      supabase.from("referral_clicks").select("link_id", { count: "exact", head: true })
        .in("link_id", linkIds),
      supabase.from("referral_clicks").select("link_id", { count: "exact", head: true })
        .in("link_id", linkIds).gte("clicked_at", monthStart.toISOString()),
      supabase.from("referral_clicks").select("link_id", { count: "exact", head: true })
        .in("link_id", linkIds).gte("clicked_at", todayStart.toISOString()),
      supabase.from("referral_clicks").select("link_id, clicked_at")
        .in("link_id", linkIds).gte("clicked_at", chartStart.toISOString())
        .order("clicked_at", { ascending: true }),
      supabase.from("referral_commissions").select("commission_amount, status")
        .in("ref_code", refCodes),
    ]);

  // Per-link click counts (all time)
  const { data: perLinkRaw } = await supabase
    .from("referral_clicks").select("link_id")
    .in("link_id", linkIds);

  const byLink: Record<string, { total: number; month: number; today: number }> = {};
  for (const l of links) byLink[l.id] = { total: 0, month: 0, today: 0 };

  for (const row of perLinkRaw ?? []) {
    if (byLink[row.link_id]) byLink[row.link_id].total++;
  }
  for (const row of monthClicks.data ?? []) {
    if (byLink[row.link_id]) byLink[row.link_id].month++;
  }
  for (const row of todayClicks.data ?? []) {
    if (byLink[row.link_id]) byLink[row.link_id].today++;
  }

  // 14-day aggregate chart
  const buckets = buildEmptyChart(chartStart);
  for (const row of chartClicks.data ?? []) {
    const day = (row.clicked_at as string).slice(0, 10);
    const b = buckets.find((b) => b.date === day);
    if (b) b.count++;
  }

  const pendingCommissions = (commissions.data ?? []).filter(
    (c) => c.status !== "cancelled",
  );

  return NextResponse.json({
    aggregate: {
      total: allClicks.count ?? 0,
      month: monthClicks.count ?? 0,
      today: todayClicks.count ?? 0,
      commissions_count: pendingCommissions.length,
      commissions_amount: pendingCommissions.reduce(
        (s, c) => s + (c.commission_amount ?? 0), 0,
      ),
    },
    by_link: byLink,
    chart: buckets,
  });
}

function buildEmptyChart(from?: Date) {
  const start = from ?? (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 13);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  })();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), count: 0 };
  });
}
