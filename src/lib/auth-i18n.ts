"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Language registry ────────────────────────────────────────────────────────

export const AUTH_LANGUAGES = [
  { code: "en", name: "English",   flag: "🇬🇧" },
  { code: "fr", name: "Français",  flag: "🇫🇷" },
  { code: "ar", name: "العربية",   flag: "🇸🇦", rtl: true },
  { code: "tr", name: "Türkçe",    flag: "🇹🇷" },
  { code: "id", name: "Bahasa",    flag: "🇮🇩" },
  { code: "ur", name: "اردو",      flag: "🇵🇰", rtl: true },
  { code: "ms", name: "Melayu",    flag: "🇲🇾" },
  { code: "bn", name: "বাংলা",     flag: "🇧🇩" },
  { code: "es", name: "Español",   flag: "🇪🇸" },
  { code: "de", name: "Deutsch",   flag: "🇩🇪" },
  { code: "fa", name: "فارسی",     flag: "🇮🇷", rtl: true },
  { code: "pt", name: "Português", flag: "🇲🇿" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
] as const;

export type AuthLangCode = (typeof AUTH_LANGUAGES)[number]["code"];
export const isAuthRTL = (lang: AuthLangCode) =>
  ["ar", "ur", "fa"].includes(lang);

// ─── Translations ─────────────────────────────────────────────────────────────

interface AuthT {
  welcomeBack: string;
  signInSubtitle: string;
  email: string;
  password: string;
  forgotPassword: string;
  signIn: string;
  signingIn: string;
  noAccount: string;
  createAccount: string;
  createAccountTitle: string;
  getStarted: string;
  fullName: string;
  confirmPassword: string;
  alreadyAccount: string;
  creatingAccount: string;
  resetPassword: string;
  resetSubtitle: string;
  sendResetLink: string;
  sending: string;
  backToSignIn: string;
  checkEmail: string;
  checkEmailSignup: string; // use {{email}} placeholder
  checkEmailReset: string;
  pwMismatch: string;
  pwTooShort: string;
}

export const AUTH_T: Record<AuthLangCode, AuthT> = {
  en: {
    welcomeBack: "Welcome back",
    signInSubtitle: "Sign in to your account",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    signIn: "Sign in",
    signingIn: "Signing in…",
    noAccount: "Don't have an account?",
    createAccount: "Create account",
    createAccountTitle: "Create account",
    getStarted: "Get started with UmmahLeads CRM",
    fullName: "Full name",
    confirmPassword: "Confirm password",
    alreadyAccount: "Already have an account?",
    creatingAccount: "Creating account…",
    resetPassword: "Reset password",
    resetSubtitle: "Enter your email and we'll send you a reset link",
    sendResetLink: "Send reset link",
    sending: "Sending…",
    backToSignIn: "Back to sign in",
    checkEmail: "Check your email",
    checkEmailSignup:
      "We've sent a confirmation link to {{email}}. Please check your inbox.",
    checkEmailReset:
      "We've sent a password reset link to {{email}}. Please check your inbox.",
    pwMismatch: "Passwords do not match",
    pwTooShort: "Password must be at least 6 characters",
  },
  fr: {
    welcomeBack: "Bon retour",
    signInSubtitle: "Connectez-vous à votre compte",
    email: "Email",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    signIn: "Se connecter",
    signingIn: "Connexion…",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    createAccountTitle: "Créer un compte",
    getStarted: "Démarrez avec UmmahLeads CRM",
    fullName: "Nom complet",
    confirmPassword: "Confirmer le mot de passe",
    alreadyAccount: "Déjà un compte ?",
    creatingAccount: "Création du compte…",
    resetPassword: "Réinitialiser le mot de passe",
    resetSubtitle:
      "Entrez votre email pour recevoir un lien de réinitialisation",
    sendResetLink: "Envoyer le lien",
    sending: "Envoi…",
    backToSignIn: "Retour à la connexion",
    checkEmail: "Vérifiez vos emails",
    checkEmailSignup:
      "Un lien de confirmation a été envoyé à {{email}}. Vérifiez votre boîte mail.",
    checkEmailReset:
      "Un lien de réinitialisation a été envoyé à {{email}}. Vérifiez votre boîte mail.",
    pwMismatch: "Les mots de passe ne correspondent pas",
    pwTooShort: "Le mot de passe doit comporter au moins 6 caractères",
  },
  ar: {
    welcomeBack: "مرحباً بعودتك",
    signInSubtitle: "سجّل الدخول إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول…",
    noAccount: "ليس لديك حساب؟",
    createAccount: "إنشاء حساب",
    createAccountTitle: "إنشاء حساب",
    getStarted: "ابدأ مع UmmahLeads CRM",
    fullName: "الاسم الكامل",
    confirmPassword: "تأكيد كلمة المرور",
    alreadyAccount: "لديك حساب بالفعل؟",
    creatingAccount: "جارٍ إنشاء الحساب…",
    resetPassword: "إعادة تعيين كلمة المرور",
    resetSubtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين",
    sendResetLink: "إرسال رابط الإعادة",
    sending: "جارٍ الإرسال…",
    backToSignIn: "العودة لتسجيل الدخول",
    checkEmail: "تحقق من بريدك الإلكتروني",
    checkEmailSignup:
      "تم إرسال رابط التأكيد إلى {{email}}. يرجى التحقق من صندوق الوارد.",
    checkEmailReset:
      "تم إرسال رابط إعادة التعيين إلى {{email}}. يرجى التحقق من صندوق الوارد.",
    pwMismatch: "كلمات المرور غير متطابقة",
    pwTooShort: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل",
  },
  tr: {
    welcomeBack: "Tekrar hoş geldiniz",
    signInSubtitle: "Hesabınıza giriş yapın",
    email: "E-posta",
    password: "Şifre",
    forgotPassword: "Şifremi unuttum?",
    signIn: "Giriş yap",
    signingIn: "Giriş yapılıyor…",
    noAccount: "Hesabınız yok mu?",
    createAccount: "Hesap oluştur",
    createAccountTitle: "Hesap oluştur",
    getStarted: "UmmahLeads CRM'e başlayın",
    fullName: "Ad Soyad",
    confirmPassword: "Şifreyi onayla",
    alreadyAccount: "Zaten hesabınız var mı?",
    creatingAccount: "Hesap oluşturuluyor…",
    resetPassword: "Şifre sıfırlama",
    resetSubtitle: "E-postanızı girin, sıfırlama bağlantısı gönderelim",
    sendResetLink: "Sıfırlama bağlantısı gönder",
    sending: "Gönderiliyor…",
    backToSignIn: "Girişe dön",
    checkEmail: "E-postanızı kontrol edin",
    checkEmailSignup:
      "{{email}} adresine onay bağlantısı gönderildi. Gelen kutunuzu kontrol edin.",
    checkEmailReset:
      "{{email}} adresine sıfırlama bağlantısı gönderildi. Gelen kutunuzu kontrol edin.",
    pwMismatch: "Şifreler eşleşmiyor",
    pwTooShort: "Şifre en az 6 karakter olmalıdır",
  },
  id: {
    welcomeBack: "Selamat datang kembali",
    signInSubtitle: "Masuk ke akun Anda",
    email: "Email",
    password: "Kata sandi",
    forgotPassword: "Lupa kata sandi?",
    signIn: "Masuk",
    signingIn: "Sedang masuk…",
    noAccount: "Belum punya akun?",
    createAccount: "Buat akun",
    createAccountTitle: "Buat akun",
    getStarted: "Mulai dengan UmmahLeads CRM",
    fullName: "Nama lengkap",
    confirmPassword: "Konfirmasi kata sandi",
    alreadyAccount: "Sudah punya akun?",
    creatingAccount: "Membuat akun…",
    resetPassword: "Reset kata sandi",
    resetSubtitle: "Masukkan email Anda, kami akan kirimkan tautan reset",
    sendResetLink: "Kirim tautan reset",
    sending: "Mengirim…",
    backToSignIn: "Kembali ke login",
    checkEmail: "Periksa email Anda",
    checkEmailSignup:
      "Tautan konfirmasi telah dikirim ke {{email}}. Periksa kotak masuk Anda.",
    checkEmailReset:
      "Tautan reset telah dikirim ke {{email}}. Periksa kotak masuk Anda.",
    pwMismatch: "Kata sandi tidak cocok",
    pwTooShort: "Kata sandi minimal 6 karakter",
  },
  ur: {
    welcomeBack: "خوش آمدید",
    signInSubtitle: "اپنے اکاؤنٹ میں لاگ ان کریں",
    email: "ای میل",
    password: "پاس ورڈ",
    forgotPassword: "پاس ورڈ بھول گئے؟",
    signIn: "لاگ ان",
    signingIn: "لاگ ان ہو رہا ہے…",
    noAccount: "اکاؤنٹ نہیں ہے؟",
    createAccount: "اکاؤنٹ بنائیں",
    createAccountTitle: "اکاؤنٹ بنائیں",
    getStarted: "UmmahLeads CRM کے ساتھ شروع کریں",
    fullName: "پورا نام",
    confirmPassword: "پاس ورڈ کی تصدیق کریں",
    alreadyAccount: "پہلے سے اکاؤنٹ ہے؟",
    creatingAccount: "اکاؤنٹ بنایا جا رہا ہے…",
    resetPassword: "پاس ورڈ ری سیٹ کریں",
    resetSubtitle: "اپنا ای میل درج کریں، ہم ری سیٹ لنک بھیجیں گے",
    sendResetLink: "ری سیٹ لنک بھیجیں",
    sending: "بھیجا جا رہا ہے…",
    backToSignIn: "لاگ ان پر واپس",
    checkEmail: "اپنا ای میل چیک کریں",
    checkEmailSignup:
      "{{email}} پر تصدیقی لنک بھیجا گیا ہے۔ اپنا ان باکس چیک کریں۔",
    checkEmailReset:
      "{{email}} پر ری سیٹ لنک بھیجا گیا ہے۔ اپنا ان باکس چیک کریں۔",
    pwMismatch: "پاس ورڈ مماثل نہیں ہیں",
    pwTooShort: "پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے",
  },
  ms: {
    welcomeBack: "Selamat kembali",
    signInSubtitle: "Log masuk ke akaun anda",
    email: "E-mel",
    password: "Kata laluan",
    forgotPassword: "Lupa kata laluan?",
    signIn: "Log masuk",
    signingIn: "Sedang log masuk…",
    noAccount: "Tiada akaun?",
    createAccount: "Buat akaun",
    createAccountTitle: "Buat akaun",
    getStarted: "Mulakan dengan UmmahLeads CRM",
    fullName: "Nama penuh",
    confirmPassword: "Sahkan kata laluan",
    alreadyAccount: "Sudah ada akaun?",
    creatingAccount: "Mencipta akaun…",
    resetPassword: "Tetapkan semula kata laluan",
    resetSubtitle:
      "Masukkan e-mel anda, kami hantar pautan tetap semula",
    sendResetLink: "Hantar pautan tetap semula",
    sending: "Menghantar…",
    backToSignIn: "Kembali ke log masuk",
    checkEmail: "Semak e-mel anda",
    checkEmailSignup:
      "Pautan pengesahan dihantar ke {{email}}. Sila semak peti masuk anda.",
    checkEmailReset:
      "Pautan tetap semula dihantar ke {{email}}. Sila semak peti masuk anda.",
    pwMismatch: "Kata laluan tidak sepadan",
    pwTooShort: "Kata laluan mesti sekurang-kurangnya 6 aksara",
  },
  bn: {
    welcomeBack: "আবার স্বাগতম",
    signInSubtitle: "আপনার অ্যাকাউন্টে সাইন ইন করুন",
    email: "ইমেইল",
    password: "পাসওয়ার্ড",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    signIn: "সাইন ইন",
    signingIn: "সাইন ইন হচ্ছে…",
    noAccount: "অ্যাকাউন্ট নেই?",
    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    createAccountTitle: "অ্যাকাউন্ট তৈরি করুন",
    getStarted: "UmmahLeads CRM দিয়ে শুরু করুন",
    fullName: "পুরো নাম",
    confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
    alreadyAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    creatingAccount: "অ্যাকাউন্ট তৈরি হচ্ছে…",
    resetPassword: "পাসওয়ার্ড রিসেট",
    resetSubtitle: "ইমেইল দিন, আমরা রিসেট লিঙ্ক পাঠাবো",
    sendResetLink: "রিসেট লিঙ্ক পাঠান",
    sending: "পাঠানো হচ্ছে…",
    backToSignIn: "সাইন ইনে ফিরুন",
    checkEmail: "ইমেইল চেক করুন",
    checkEmailSignup:
      "{{email}}-এ নিশ্চিতকরণ লিঙ্ক পাঠানো হয়েছে। ইনবক্স দেখুন।",
    checkEmailReset:
      "{{email}}-এ রিসেট লিঙ্ক পাঠানো হয়েছে। ইনবক্স দেখুন।",
    pwMismatch: "পাসওয়ার্ড মিলছে না",
    pwTooShort: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে",
  },
  es: {
    welcomeBack: "Bienvenido de nuevo",
    signInSubtitle: "Inicia sesión en tu cuenta",
    email: "Correo electrónico",
    password: "Contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión…",
    noAccount: "¿No tienes cuenta?",
    createAccount: "Crear cuenta",
    createAccountTitle: "Crear cuenta",
    getStarted: "Empieza con UmmahLeads CRM",
    fullName: "Nombre completo",
    confirmPassword: "Confirmar contraseña",
    alreadyAccount: "¿Ya tienes cuenta?",
    creatingAccount: "Creando cuenta…",
    resetPassword: "Restablecer contraseña",
    resetSubtitle:
      "Ingresa tu email y te enviaremos un enlace de restablecimiento",
    sendResetLink: "Enviar enlace",
    sending: "Enviando…",
    backToSignIn: "Volver al inicio de sesión",
    checkEmail: "Revisa tu correo",
    checkEmailSignup:
      "Enviamos un enlace de confirmación a {{email}}. Revisa tu bandeja.",
    checkEmailReset:
      "Enviamos un enlace de restablecimiento a {{email}}. Revisa tu bandeja.",
    pwMismatch: "Las contraseñas no coinciden",
    pwTooShort: "La contraseña debe tener al menos 6 caracteres",
  },
  de: {
    welcomeBack: "Willkommen zurück",
    signInSubtitle: "Melden Sie sich bei Ihrem Konto an",
    email: "E-Mail",
    password: "Passwort",
    forgotPassword: "Passwort vergessen?",
    signIn: "Anmelden",
    signingIn: "Anmeldung läuft…",
    noAccount: "Noch kein Konto?",
    createAccount: "Konto erstellen",
    createAccountTitle: "Konto erstellen",
    getStarted: "Starten Sie mit UmmahLeads CRM",
    fullName: "Vollständiger Name",
    confirmPassword: "Passwort bestätigen",
    alreadyAccount: "Bereits ein Konto?",
    creatingAccount: "Konto wird erstellt…",
    resetPassword: "Passwort zurücksetzen",
    resetSubtitle:
      "Geben Sie Ihre E-Mail ein, wir senden Ihnen einen Reset-Link",
    sendResetLink: "Reset-Link senden",
    sending: "Senden…",
    backToSignIn: "Zurück zur Anmeldung",
    checkEmail: "E-Mail prüfen",
    checkEmailSignup:
      "Ein Bestätigungslink wurde an {{email}} gesendet. Bitte prüfen Sie Ihren Posteingang.",
    checkEmailReset:
      "Ein Reset-Link wurde an {{email}} gesendet. Bitte prüfen Sie Ihren Posteingang.",
    pwMismatch: "Passwörter stimmen nicht überein",
    pwTooShort: "Das Passwort muss mindestens 6 Zeichen lang sein",
  },
  fa: {
    welcomeBack: "خوش برگشتید",
    signInSubtitle: "وارد حساب خود شوید",
    email: "ایمیل",
    password: "رمز عبور",
    forgotPassword: "رمز عبور را فراموش کردید؟",
    signIn: "ورود",
    signingIn: "در حال ورود…",
    noAccount: "حساب ندارید؟",
    createAccount: "ایجاد حساب",
    createAccountTitle: "ایجاد حساب",
    getStarted: "با UmmahLeads CRM شروع کنید",
    fullName: "نام کامل",
    confirmPassword: "تأیید رمز عبور",
    alreadyAccount: "قبلاً حساب دارید؟",
    creatingAccount: "در حال ایجاد حساب…",
    resetPassword: "بازیابی رمز عبور",
    resetSubtitle:
      "ایمیل خود را وارد کنید تا لینک بازیابی ارسال شود",
    sendResetLink: "ارسال لینک بازیابی",
    sending: "در حال ارسال…",
    backToSignIn: "بازگشت به ورود",
    checkEmail: "ایمیل خود را بررسی کنید",
    checkEmailSignup:
      "لینک تأیید به {{email}} ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.",
    checkEmailReset:
      "لینک بازیابی به {{email}} ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.",
    pwMismatch: "رمزهای عبور مطابقت ندارند",
    pwTooShort: "رمز عبور باید حداقل ۶ کاراکتر باشد",
  },
  pt: {
    welcomeBack: "Bem-vindo de volta",
    signInSubtitle: "Entre na sua conta",
    email: "E-mail",
    password: "Senha",
    forgotPassword: "Esqueceu a senha?",
    signIn: "Entrar",
    signingIn: "Entrando…",
    noAccount: "Não tem conta?",
    createAccount: "Criar conta",
    createAccountTitle: "Criar conta",
    getStarted: "Comece com o UmmahLeads CRM",
    fullName: "Nome completo",
    confirmPassword: "Confirmar senha",
    alreadyAccount: "Já tem conta?",
    creatingAccount: "Criando conta…",
    resetPassword: "Redefinir senha",
    resetSubtitle:
      "Digite seu e-mail e enviaremos um link de redefinição",
    sendResetLink: "Enviar link de redefinição",
    sending: "Enviando…",
    backToSignIn: "Voltar ao login",
    checkEmail: "Verifique seu e-mail",
    checkEmailSignup:
      "Enviamos um link de confirmação para {{email}}. Verifique sua caixa de entrada.",
    checkEmailReset:
      "Enviamos um link de redefinição para {{email}}. Verifique sua caixa de entrada.",
    pwMismatch: "As senhas não coincidem",
    pwTooShort: "A senha deve ter pelo menos 6 caracteres",
  },
  sw: {
    welcomeBack: "Karibu tena",
    signInSubtitle: "Ingia kwenye akaunti yako",
    email: "Barua pepe",
    password: "Nenosiri",
    forgotPassword: "Umesahau nenosiri?",
    signIn: "Ingia",
    signingIn: "Inaingia…",
    noAccount: "Huna akaunti?",
    createAccount: "Fungua akaunti",
    createAccountTitle: "Fungua akaunti",
    getStarted: "Anza na UmmahLeads CRM",
    fullName: "Jina kamili",
    confirmPassword: "Thibitisha nenosiri",
    alreadyAccount: "Una akaunti tayari?",
    creatingAccount: "Inafungua akaunti…",
    resetPassword: "Weka upya nenosiri",
    resetSubtitle:
      "Weka barua pepe yako, tutatuma kiungo cha kuweka upya",
    sendResetLink: "Tuma kiungo cha kuweka upya",
    sending: "Inatuma…",
    backToSignIn: "Rudi kwenye kuingia",
    checkEmail: "Angalia barua pepe yako",
    checkEmailSignup:
      "Kiungo cha uthibitishaji kimetumwa kwa {{email}}. Tafadhali angalia kisanduku chako.",
    checkEmailReset:
      "Kiungo cha kuweka upya kimetumwa kwa {{email}}. Tafadhali angalia kisanduku chako.",
    pwMismatch: "Maneno ya siri hayalingani",
    pwTooShort: "Nenosiri lazima liwe na angalau herufi 6",
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

export function interpolate(str: string, vars: Record<string, string>) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ummahleads-crm-lang";

export function useAuthLang() {
  const [lang, setLangState] = useState<AuthLangCode>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AuthLangCode | null;
      if (stored && AUTH_LANGUAGES.some((l) => l.code === stored)) {
        setLangState(stored);
        document.documentElement.dir = isAuthRTL(stored) ? "rtl" : "ltr";
        return;
      }
      const browser = navigator.language.split("-")[0] as AuthLangCode;
      if (AUTH_LANGUAGES.some((l) => l.code === browser)) {
        setLangState(browser);
        document.documentElement.dir = isAuthRTL(browser) ? "rtl" : "ltr";
      }
    } catch {}
  }, []);

  const setLang = useCallback((code: AuthLangCode) => {
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {}
    document.documentElement.dir = isAuthRTL(code) ? "rtl" : "ltr";
  }, []);

  return { lang, setLang, t: AUTH_T[lang], rtl: isAuthRTL(lang) };
}
