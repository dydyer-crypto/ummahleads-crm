"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferralLink {
  id: string;
  ref_code: string;
  destination_url: string;
  click_count: number;
  created_at: string;
  link_url: string;
}

interface Stats {
  total: number;
  week: number;
  today: number;
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
      `Assalamu Alaikum!\n\nI found some great halal real estate opportunities on UmmahLeads that might interest you 🏡\n\n✅ Off-market deals in 57 OIC countries\n✅ Sharia-compliant financing options\n✅ AI-powered property matching\n\nCreate your free account here:\n${url}\n\nJazakallah Khair 🤲`,
  },
  {
    id: "finance",
    label: "Financing",
    icon: "💎",
    message: (url: string) =>
      `Assalamu Alaikum!\n\nAre you looking for halal financing for your real estate project? 💎\n\nUmmahLeads offers:\n- Murabaha & Ijara Islamic financing\n- No riba — 100% Sharia compliant\n- Available in 57 OIC countries\n\nJoin thousands of Muslim investors:\n${url}\n\nBaraka Allahu Fik`,
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
    <div className="flex h-28 items-end gap-1">
      {data.map((d) => (
        <div key={d.date} className="group relative flex flex-1 flex-col items-center gap-1">
          {/* Tooltip */}
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
  const [link, setLink] = useState<ReferralLink | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Edit mode
  const [editingCode, setEditingCode] = useState(false);
  const [editingDest, setEditingDest] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDest, setNewDest] = useState("");
  const [saving, setSaving] = useState(false);

  // QR modal
  const [qrOpen, setQrOpen] = useState(false);

  // WhatsApp composer
  const [templateId, setTemplateId] = useState("invite");
  const [message, setMessage] = useState("");

  const loadLink = useCallback(async () => {
    const res = await fetch("/api/referrals/link");
    if (!res.ok) return;
    const data: ReferralLink = await res.json();
    setLink(data);
    // Init message with first template
    const tpl = TEMPLATES[0].message(data.link_url);
    setMessage(tpl);
    return data;
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/referrals/stats");
    if (!res.ok) return;
    setStats(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadLink(), loadStats()]);
      setLoading(false);
    })();
  }, [loadLink, loadStats]);

  // Keep message in sync with template + link changes
  useEffect(() => {
    if (!link) return;
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (tpl) setMessage(tpl.message(link.link_url));
  }, [templateId, link]);

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link.link_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const saveCode = async () => {
    if (!newCode.trim()) return;
    setSaving(true);
    const res = await fetch("/api/referrals/link", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_code: newCode.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update");
    } else {
      setLink(data);
      setEditingCode(false);
      toast.success("Code updated!");
    }
    setSaving(false);
  };

  const saveDest = async () => {
    if (!newDest.trim()) return;
    setSaving(true);
    const res = await fetch("/api/referrals/link", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination_url: newDest.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update");
    } else {
      setLink(data);
      setEditingDest(false);
      toast.success("Destination updated!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-800/50" />
      </div>
    );
  }

  const qrUrl = link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link.link_url)}&format=png`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Link2 className="h-6 w-6 text-[#D4AF37]" />
          Referrals
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Share your affiliate link and track every click in real time.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Clicks",
            value: stats?.total ?? 0,
            icon: MousePointerClick,
            color: "text-[#D4AF37]",
            bg: "bg-[#D4AF37]/10",
          },
          {
            label: "This Week",
            value: stats?.week ?? 0,
            icon: Calendar,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Today",
            value: stats?.today ?? 0,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
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
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Your Link ─────────────────────────────────────── */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Link2 className="h-4 w-4 text-[#D4AF37]" />
            Your Affiliate Link
          </h2>

          {/* Link URL */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5">
            <span className="flex-1 truncate font-mono text-sm text-[#D4AF37]">
              {link?.link_url ?? "—"}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              title="Copy link"
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
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              title="QR Code"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>

          {/* Ref code edit */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-500">Ref code</Label>
              <button
                type="button"
                onClick={() => {
                  setNewCode(link?.ref_code ?? "");
                  setEditingCode(true);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#D4AF37]"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </button>
            </div>
            {editingCode ? (
              <div className="mt-1 flex gap-2">
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="h-8 border-slate-700 bg-slate-800 text-sm text-white focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
                  placeholder="my-custom-code"
                />
                <Button
                  size="sm"
                  onClick={saveCode}
                  disabled={saving}
                  className="h-8 bg-[#D4AF37] text-xs font-semibold text-slate-950 hover:bg-[#B8960C]"
                >
                  {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Save"}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingCode(false)}
                  className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="mt-1 font-mono text-sm text-slate-300">
                {link?.ref_code}
              </p>
            )}
          </div>

          {/* Destination URL edit */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-500">Destination URL</Label>
              <button
                type="button"
                onClick={() => {
                  setNewDest(link?.destination_url ?? "");
                  setEditingDest(true);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#D4AF37]"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </button>
            </div>
            {editingDest ? (
              <div className="mt-1 flex gap-2">
                <Input
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  className="h-8 border-slate-700 bg-slate-800 text-sm text-white focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
                  placeholder="https://ummahleads.app"
                />
                <Button
                  size="sm"
                  onClick={saveDest}
                  disabled={saving}
                  className="h-8 bg-[#D4AF37] text-xs font-semibold text-slate-950 hover:bg-[#B8960C]"
                >
                  {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Save"}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingDest(false)}
                  className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="mt-1 truncate text-sm text-slate-300">
                {link?.destination_url}
              </p>
            )}
          </div>

          {/* Share buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={copyLink}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              onClick={() => setQrOpen(true)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => window.open(link?.link_url, "_blank")}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── WhatsApp Composer ─────────────────────────────── */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <MessageCircle className="h-4 w-4 text-emerald-400" />
            WhatsApp Message
          </h2>

          {/* Template picker */}
          <div className="flex gap-2">
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

          {/* Editable message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={9}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/20"
          />

          <Button
            onClick={shareWhatsApp}
            className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Send via WhatsApp
          </Button>
        </div>
      </div>

      {/* 14-day chart */}
      {stats && stats.chart.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart2 className="h-4 w-4 text-[#D4AF37]" />
            Clicks — last 14 days
          </h2>
          <MiniChart data={stats.chart} />
          {/* X-axis labels: first + last */}
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>
              {new Date(stats.chart[0].date + "T00:00:00Z").toLocaleDateString(
                "en",
                { month: "short", day: "numeric" },
              )}
            </span>
            <span>
              {new Date(
                stats.chart[stats.chart.length - 1].date + "T00:00:00Z",
              ).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      )}

      {/* QR Code modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs border-slate-700 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-white">QR Code</DialogTitle>
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
              <span className="text-[#D4AF37]">{link?.link_url}</span>
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
