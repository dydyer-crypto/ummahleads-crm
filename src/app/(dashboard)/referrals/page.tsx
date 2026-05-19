"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Link2,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Edit3,
  BarChart2,
  MousePointerClick,
  Calendar,
  TrendingUp,
  X,
  Download,
  Plus,
  Trophy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferralLink {
  id: string;
  ref_code: string;
  campaign_name: string;
  destination_url: string;
  is_active: boolean;
  created_at: string;
  link_url: string;
}

interface LinkStat {
  total: number;
  month: number;
  today: number;
}

interface StatsResponse {
  aggregate: {
    total: number;
    month: number;
    today: number;
    commissions_count: number;
    commissions_amount: number;
  };
  by_link: Record<string, LinkStat>;
  chart: { date: string; count: number }[];
}

// ─── WhatsApp message templates ───────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "invite",
    label: "Invitation",
    icon: "🌙",
    message: (url: string) =>
      `Assalamu Alaikum! 🌙\n\nJe vous invite à découvrir UmmahLeads — la première plateforme immobilière halal pour les 57 pays de l'OCI.\n\n🏠 Trouvez votre bien idéal\n✅ Financement islamique (Murabaha/Ijara)\n🤝 Experts dédiés à votre projet\n\nInscrivez-vous gratuitement :\n${url}\n\nBaraka Allahu Fik 🤲`,
  },
  {
    id: "property",
    label: "Property",
    icon: "🏡",
    message: (url: string) =>
      `Assalamu Alaikum!\n\nI found some great halal real estate opportunities on UmmahLeads 🏡\n\n✅ Off-market deals in 57 OIC countries\n✅ Sharia-compliant financing\n✅ AI-powered property matching\n\nCreate your free account:\n${url}\n\nJazakallah Khair 🤲`,
  },
  {
    id: "finance",
    label: "Financing",
    icon: "💎",
    message: (url: string) =>
      `Assalamu Alaikum!\n\nLooking for halal financing for your real estate project? 💎\n\nUmmahLeads offers Murabaha & Ijara — no riba, 100% Sharia compliant, available in 57 OCI countries.\n\n${url}\n\nBaraka Allahu Fik`,
  },
];

// ─── Mini bar chart ────────────────────────────────────────────────────────────

function MiniChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-24 items-end gap-0.5">
      {data.map((d) => (
        <div
          key={d.date}
          className="group relative flex flex-1 flex-col items-center"
        >
          <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-slate-700 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
            {formatDate(d.date)}: {d.count}
          </div>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${Math.max((d.count / max) * 96, d.count > 0 ? 4 : 1)}px`,
              background:
                d.count > 0
                  ? "linear-gradient(to top, #B8960C, #D4AF37)"
                  : "#1e293b",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  // New campaign dialog
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDest, setNewDest] = useState("");
  const [creating, setCreating] = useState(false);

  // Selected campaign actions
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [templateId, setTemplateId] = useState("invite");
  const [message, setMessage] = useState("");

  // Inline edit
  const [editField, setEditField] = useState<"name" | "code" | "dest" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/referrals/link");
    if (!res.ok) return;
    const data: ReferralLink[] = await res.json();
    setLinks(data);
    if (data.length > 0) {
      setSelectedId((prev) =>
        prev && data.some((l) => l.id === prev) ? prev : data[0].id,
      );
    }
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/referrals/stats");
    if (!res.ok) return;
    setStats(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadLinks(), loadStats()]);
      setLoading(false);
    })();
  }, [loadLinks, loadStats]);

  const selected = links.find((l) => l.id === selectedId) ?? null;

  // Sync WhatsApp message with template + selected link
  useEffect(() => {
    if (!selected) return;
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (tpl) setMessage(tpl.message(selected.link_url));
  }, [templateId, selected]);

  const copyLink = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.link_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  async function createCampaign() {
    if (!newName.trim()) return;
    setCreating(true);
    const body: Record<string, string> = { campaign_name: newName.trim() };
    if (newDest.trim()) body.destination_url = newDest.trim();
    const res = await fetch("/api/referrals/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to create campaign");
    } else {
      toast.success("Campaign created!");
      setNewName("");
      setNewDest("");
      setNewOpen(false);
      await loadLinks();
      setSelectedId(data.id);
    }
    setCreating(false);
  }

  async function saveEdit() {
    if (!selected || !editField) return;
    const fieldMap: Record<typeof editField, string> = {
      name: "campaign_name",
      code: "ref_code",
      dest: "destination_url",
    };
    setSaving(true);
    const res = await fetch(`/api/referrals/link/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldMap[editField]]: editValue.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update");
    } else {
      toast.success("Updated!");
      setEditField(null);
      await loadLinks();
    }
    setSaving(false);
  }

  async function toggleActive(link: ReferralLink) {
    const res = await fetch(`/api/referrals/link/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !link.is_active }),
    });
    if (!res.ok) {
      toast.error("Failed to update");
    } else {
      toast.success(link.is_active ? "Campaign paused" : "Campaign activated");
      await loadLinks();
    }
  }

  async function deleteCampaign(id: string) {
    const res = await fetch(`/api/referrals/link/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Campaign deleted");
    await loadLinks();
    setSelectedId((prev) => {
      if (prev !== id) return prev;
      const remaining = links.filter((l) => l.id !== id);
      return remaining[0]?.id ?? "";
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-800/50" />
      </div>
    );
  }

  const qrUrl = selected
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selected.link_url)}&format=png`
    : null;

  const agg = stats?.aggregate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Link2 className="h-6 w-6 text-[#D4AF37]" />
            Referrals
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your affiliate campaigns and track every click in real time.
          </p>
        </div>
        <Link
          href="/referrals/leaderboard"
          className="flex items-center gap-2 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
        >
          <Trophy className="h-4 w-4" />
          Leaderboard
        </Link>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Clicks",
            value: agg?.total ?? 0,
            icon: MousePointerClick,
            color: "text-[#D4AF37]",
            bg: "bg-[#D4AF37]/10",
          },
          {
            label: "This Month",
            value: agg?.month ?? 0,
            icon: Calendar,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Today",
            value: agg?.today ?? 0,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Commissions",
            value: agg
              ? `€${agg.commissions_amount.toFixed(0)} (${agg.commissions_count})`
              : "—",
            icon: DollarSign,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Campaigns table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Campaigns</h2>
          <Button
            size="sm"
            onClick={() => setNewOpen(true)}
            className="h-7 bg-[#D4AF37] text-xs font-semibold text-slate-950 hover:bg-[#B8960C]"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            New Campaign
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No campaigns yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {links.map((l) => {
              const ls = stats?.by_link?.[l.id];
              const isSelected = l.id === selectedId;
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={`flex cursor-pointer items-center gap-3 px-5 py-3.5 transition-colors ${
                    isSelected
                      ? "bg-[#D4AF37]/5"
                      : "hover:bg-slate-800/40"
                  }`}
                >
                  {/* Active dot */}
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      l.is_active ? "bg-emerald-400" : "bg-slate-600"
                    }`}
                  />

                  {/* Campaign name + URL */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {l.campaign_name}
                    </p>
                    <p className="truncate font-mono text-xs text-slate-500">
                      {l.link_url}
                    </p>
                  </div>

                  {/* Per-link stats */}
                  <div className="hidden shrink-0 items-center gap-6 sm:flex">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">
                        {ls?.total ?? 0}
                      </p>
                      <p className="text-xs text-slate-500">All time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">
                        {ls?.month ?? 0}
                      </p>
                      <p className="text-xs text-slate-500">Month</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">
                        {ls?.today ?? 0}
                      </p>
                      <p className="text-xs text-slate-500">Today</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => toggleActive(l)}
                      className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-white"
                      title={l.is_active ? "Pause" : "Activate"}
                    >
                      {l.is_active ? (
                        <ToggleRight className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCampaign(l.id)}
                      className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected campaign detail */}
      {selected && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Campaign link panel ─────────────────────────── */}
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Link2 className="h-4 w-4 text-[#D4AF37]" />
              {selected.campaign_name}
            </h2>

            {/* Link URL copy row */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5">
              <span className="flex-1 truncate font-mono text-sm text-[#D4AF37]">
                {selected.link_url}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white"
                title="QR Code"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => window.open(selected.link_url, "_blank")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white"
                title="Open"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            {/* Editable fields */}
            {(["name", "code", "dest"] as const).map((field) => {
              const labels = {
                name: "Campaign name",
                code: "Ref code",
                dest: "Destination URL",
              };
              const values = {
                name: selected.campaign_name,
                code: selected.ref_code,
                dest: selected.destination_url,
              };
              return (
                <div key={field}>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-500">
                      {labels[field]}
                    </Label>
                    {editField !== field && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditField(field);
                          setEditValue(values[field]);
                        }}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#D4AF37]"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                  </div>
                  {editField === field ? (
                    <div className="mt-1 flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 border-slate-700 bg-slate-800 text-sm text-white focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditField(null);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={saving}
                        className="h-8 bg-[#D4AF37] text-xs font-semibold text-slate-950 hover:bg-[#B8960C]"
                      >
                        {saving ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setEditField(null)}
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 truncate font-mono text-sm text-slate-300">
                      {values[field]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── WhatsApp Composer ─────────────────────────────── */}
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              WhatsApp Message
            </h2>

            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    templateId === t.id
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                      : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={9}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/20"
            />

            <Button
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(message)}`,
                  "_blank",
                )
              }
              className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Send via WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* 14-day chart */}
      {stats?.chart && stats.chart.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart2 className="h-4 w-4 text-[#D4AF37]" />
            Clicks — last 14 days (all campaigns)
          </h2>
          <MiniChart data={stats.chart} />
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>
              {new Date(
                stats.chart[0].date + "T00:00:00Z",
              ).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
            <span>
              {new Date(
                stats.chart[stats.chart.length - 1].date + "T00:00:00Z",
              ).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      )}

      {/* New Campaign dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-sm border-slate-700 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-white">New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label className="text-slate-300">Campaign Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Paris Meetup, LinkedIn, Dubai Expo"
                className="border-slate-700 bg-slate-800 text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") createCampaign();
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-300">
                Destination URL{" "}
                <span className="text-slate-500">(optional)</span>
              </Label>
              <Input
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                placeholder="https://ummahleads.app"
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={createCampaign}
              disabled={creating || !newName.trim()}
              className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8960C]"
            >
              {creating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs border-slate-700 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-white">
              QR Code — {selected?.campaign_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrUrl && (
              <div className="rounded-xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="QR code for your referral link"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
            )}
            <p className="text-center text-xs text-slate-400">
              Scan to open{" "}
              <span className="text-[#D4AF37]">{selected?.link_url}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyLink}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={() => qrUrl && window.open(qrUrl, "_blank")}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
