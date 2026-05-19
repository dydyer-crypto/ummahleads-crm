"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle, ChevronDown, Check } from "lucide-react";
import {
  AUTH_LANGUAGES,
  useAuthLang,
  interpolate,
  type AuthLangCode,
} from "@/lib/auth-i18n";

// ─── Language switcher (shared pattern) ──────────────────────────────────────

function LangPicker({
  lang,
  setLang,
}: {
  lang: AuthLangCode;
  setLang: (l: AuthLangCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = AUTH_LANGUAGES.find((l) => l.code === lang) ?? AUTH_LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-[#D4AF37] backdrop-blur transition-colors hover:border-[#D4AF37]/40 hover:bg-white/10"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-[#D4AF37]/15 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
          {AUTH_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
              style={{
                color: l.code === lang ? "#D4AF37" : "#94A3B8",
                background:
                  l.code === lang ? "rgba(212,175,55,0.08)" : "transparent",
              }}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex-1 text-start">{l.name}</span>
              {l.code === lang && (
                <Check className="h-3.5 w-3.5 text-[#D4AF37]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const { lang, setLang, t, rtl } = useAuthLang();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t.pwMismatch);
      return;
    }
    if (password.length < 6) {
      setError(t.pwTooShort);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4"
        dir={rtl ? "rtl" : "ltr"}
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="UmmahLeads" className="h-14 w-14 object-contain" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#D4AF37]">UmmahLeads</span>
            <span className="rounded-md bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/70 ring-1 ring-[#D4AF37]/20">CRM</span>
          </div>
        </div>
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur">
          <CardHeader className="items-center pb-4 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10">
              <CheckCircle className="h-6 w-6 text-[#D4AF37]" />
            </div>
            <h1 className="text-xl font-semibold text-white">{t.checkEmail}</h1>
            <p className="text-sm text-slate-400">
              {interpolate(t.checkEmailSignup, { email })}
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                {t.backToSignIn}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4"
      dir={rtl ? "rtl" : "ltr"}
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#D4AF37]/3 blur-3xl" />
      </div>

      {/* Language switcher */}
      <div className="absolute end-4 top-4 z-10">
        <LangPicker lang={lang} setLang={setLang} />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="UmmahLeads" className="h-14 w-14 object-contain" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#D4AF37]">UmmahLeads</span>
          <span className="rounded-md bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/70 ring-1 ring-[#D4AF37]/20">CRM</span>
        </div>
      </div>

      {/* Card */}
      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur">
        <CardHeader className="pb-4 text-center">
          <h1 className="text-xl font-semibold text-white">{t.createAccountTitle}</h1>
          <p className="text-sm text-slate-400">{t.getStarted}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName" className="text-slate-300">{t.fullName}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ahmed Al-Rashid"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-slate-300">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-slate-300">{t.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">{t.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full bg-[#D4AF37] font-semibold text-slate-950 hover:bg-[#B8960C] disabled:opacity-50"
            >
              {loading ? t.creatingAccount : t.createAccount}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {t.alreadyAccount}{" "}
            <Link href="/login" className="font-medium text-[#D4AF37] hover:text-[#D4AF37]/80">
              {t.signIn}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
