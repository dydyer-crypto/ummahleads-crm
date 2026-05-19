"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, ArrowLeft, MousePointerClick, DollarSign } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_clicks: number;
  commissions_count: number;
  commissions_amount: number;
  is_me: boolean;
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37]/20 text-sm font-bold text-[#D4AF37]">
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="text-lg" title="Gold">🥇</span>;
  if (rank === 2)
    return <span className="text-lg" title="Silver">🥈</span>;
  if (rank === 3)
    return <span className="text-lg" title="Bronze">🥉</span>;
  return (
    <span className="text-sm font-semibold text-slate-500">#{rank}</span>
  );
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/referrals/leaderboard");
      if (res.ok) setBoard(await res.json());
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/referrals"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Trophy className="h-6 w-6 text-[#D4AF37]" />
            Leaderboard
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Top agents ranked by referral clicks.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-slate-800/50"
            />
          ))}
        </div>
      ) : board.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-16 text-center">
          <Trophy className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-slate-400">No referral data yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Share your link and be the first on the board!
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {/* Column headers (desktop only) */}
          <div className="hidden grid-cols-[56px_1fr_120px_120px_120px] items-center gap-4 border-b border-slate-800 px-5 py-3 sm:grid">
            <div />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Agent
            </p>
            <p className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Clicks
            </p>
            <p className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Commissions
            </p>
            <p className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Earned
            </p>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-800/60">
            {board.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  entry.is_me
                    ? "border-l-2 border-[#D4AF37] bg-[#D4AF37]/5"
                    : "hover:bg-slate-800/30"
                }`}
              >
                {/* Rank */}
                <div className="flex h-10 w-8 shrink-0 items-center justify-center">
                  <RankBadge rank={entry.rank} />
                </div>

                {/* Avatar + name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={entry.full_name} url={entry.avatar_url} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {entry.full_name}
                      {entry.is_me && (
                        <span className="ml-2 rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-xs font-medium text-[#D4AF37]">
                          You
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex shrink-0 items-center gap-6">
                  <div className="text-right">
                    <p className="flex items-center justify-end gap-1 text-sm font-bold text-white">
                      <MousePointerClick className="h-3.5 w-3.5 text-[#D4AF37]" />
                      {entry.total_clicks}
                    </p>
                    <p className="text-xs text-slate-500 sm:hidden">Clicks</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-white">
                      {entry.commissions_count}
                    </p>
                    <p className="text-xs text-slate-500">Deals</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="flex items-center justify-end gap-1 text-sm font-bold text-emerald-400">
                      <DollarSign className="h-3.5 w-3.5" />
                      {entry.commissions_amount.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
