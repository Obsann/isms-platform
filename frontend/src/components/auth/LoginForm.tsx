"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ApiRequestError, getSessionUser, login, portalHome } from "@/lib/api-client";
import { PLATFORM_TENANT_CODE } from "@/types";
import FormFieldGroup from "@/components/forms/FormFieldGroup";
import { Card, CardContent } from "@/components/ui/Card";
import ThemeToggleButton from "@/components/theme/ThemeToggleButton";
import { useLang } from "@/components/i18n";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useLang();
  const [tenantCode, setTenantCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    if (user) {
      router.replace(portalHome(user.role));
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login({
        tenantCode: tenantCode.trim(),
        email: email.trim(),
        password,
      });
      router.replace(portalHome(result.user.role));
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : t("login.failed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-surface dark:bg-midnight flex items-center justify-center p-6 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(circle, rgb(216 177 56 / 0.5) 0.8px, transparent 0.9px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm font-medium text-slate-500 dark:text-white/50 hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-midnight"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t("login.back")}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-full bg-gold text-midnight flex items-center justify-center font-display text-[10px] font-bold tracking-wider shadow-[0_0_0_3px_rgba(197,155,39,0.2)] notranslate">
            ISMS
          </div>
          <div className="leading-none">
            <p className="font-display text-sm font-bold text-slate-900 dark:text-white tracking-[0.2em] uppercase notranslate">
              ISMS
            </p>
            <p className="text-[10px] text-slate-500 dark:text-white/40 tracking-[0.15em] uppercase mt-1">
              {t("login.subtitle")}
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <FormFieldGroup
                label={t("login.tenantCode")}
                htmlFor="tenantCode"
                required
                helperText={t("login.tenantHelper", { code: PLATFORM_TENANT_CODE })}
              >
                <input
                  id="tenantCode"
                  name="tenantCode"
                  autoComplete="organization"
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value)}
                  required
                />
              </FormFieldGroup>

              <FormFieldGroup label={t("login.email")} htmlFor="email" required>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormFieldGroup>

              <FormFieldGroup label={t("login.password")} htmlFor="password" required>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/90 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-gold dark:focus:border-gold focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    aria-label={passwordVisible ? t("login.hidePassword") : t("login.showPassword")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 dark:text-white/50 hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {passwordVisible ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </FormFieldGroup>

              {error && (
                <p className="text-[13px] font-semibold text-rose-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-gold text-midnight font-semibold text-sm tracking-wide hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-midnight"
              >
                {submitting ? t("login.signingIn") : t("login.signIn")}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
