import { type NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

// Public redirect handler — no auth required.
// Logs a click event and sends the visitor to the destination URL.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const fallback = NextResponse.redirect(
    new URL("https://ummahleads.app"),
  );

  if (!code) return fallback;

  // Use service-role client so RLS doesn't block the anonymous read/write.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: link, error } = await admin
    .from("referral_links")
    .select("id, destination_url, ref_code")
    .eq("ref_code", code)
    .single();

  if (error || !link) return fallback;

  // Track click — fire and forget (never block the redirect).
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const ipHash = ip
    ? createHash("sha256").update(ip).digest("hex").slice(0, 16)
    : null;

  admin
    .from("referral_clicks")
    .insert({
      link_id: link.id,
      ip_hash: ipHash,
      user_agent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
      referrer: req.headers.get("referer")?.slice(0, 255) ?? null,
    })
    .then(() => {});

  // Append ref code to destination so ummahleads.app can attribute signups.
  const dest = new URL(link.destination_url);
  dest.searchParams.set("ref", link.ref_code);

  return NextResponse.redirect(dest, { status: 302 });
}
