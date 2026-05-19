import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the user's link id
  const { data: link } = await supabase
    .from("referral_links")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!link) {
    // No link yet — return zeroes
    return NextResponse.json({
      total: 0,
      week: 0,
      today: 0,
      chart: [] as { date: string; count: number }[],
    });
  }

  const linkId = link.id;
  const now = new Date();

  // Start of today (UTC)
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // Start of this week (Monday UTC)
  const weekStart = new Date(now);
  weekStart.setUTCHours(0, 0, 0, 0);
  const day = weekStart.getUTCDay(); // 0 = Sun
  weekStart.setUTCDate(weekStart.getUTCDate() - ((day + 6) % 7));

  // 14-day start
  const chartStart = new Date(now);
  chartStart.setUTCDate(chartStart.getUTCDate() - 13);
  chartStart.setUTCHours(0, 0, 0, 0);

  const [totalRes, weekRes, todayRes, chartRes] = await Promise.all([
    supabase
      .from("referral_clicks")
      .select("id", { count: "exact", head: true })
      .eq("link_id", linkId),
    supabase
      .from("referral_clicks")
      .select("id", { count: "exact", head: true })
      .eq("link_id", linkId)
      .gte("clicked_at", weekStart.toISOString()),
    supabase
      .from("referral_clicks")
      .select("id", { count: "exact", head: true })
      .eq("link_id", linkId)
      .gte("clicked_at", todayStart.toISOString()),
    supabase
      .from("referral_clicks")
      .select("clicked_at")
      .eq("link_id", linkId)
      .gte("clicked_at", chartStart.toISOString())
      .order("clicked_at", { ascending: true }),
  ]);

  // Bucket clicks by day for the chart
  const buckets: Record<string, number> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(chartStart);
    d.setUTCDate(d.getUTCDate() + i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of chartRes.data ?? []) {
    const day = (row.clicked_at as string).slice(0, 10);
    if (day in buckets) buckets[day]++;
  }
  const chart = Object.entries(buckets).map(([date, count]) => ({
    date,
    count,
  }));

  return NextResponse.json({
    total: totalRes.count ?? 0,
    week: weekRes.count ?? 0,
    today: todayRes.count ?? 0,
    chart,
  });
}
