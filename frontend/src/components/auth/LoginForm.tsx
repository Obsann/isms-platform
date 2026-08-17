"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, getSessionUser, login, portalHome } from "@/lib/api-client";
import { PLATFORM_TENANT_CODE } from "@/types";
import FormFieldGroup from "@/components/forms/FormFieldGroup";
import { Card, CardContent } from "@/components/ui/Card";

export default function LoginForm() {
  const router = useRouter();
  const [tenantCode, setTenantCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          : "Could not sign in. Check your details and try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-midnight flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center">
            <span className="font-display text-[10px] font-bold text-gold tracking-wider">ISMS</span>
          </div>
          <div className="leading-none">
            <p className="font-display text-sm font-bold text-white tracking-[0.2em] uppercase">
              ISMS
            </p>
            <p className="text-[10px] text-white/40 tracking-[0.15em] uppercase mt-1">
              Sign in to your portal
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <FormFieldGroup
                label="Tenant code"
                htmlFor="tenantCode"
                required
                helperText={`SACCO code (tenant-a or tenant-b). Super Admin uses “${PLATFORM_TENANT_CODE}”.`}
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

              <FormFieldGroup label="Email" htmlFor="email" required>
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

              <FormFieldGroup label="Password" htmlFor="password" required>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormFieldGroup>

              {error && (
                <p className="text-[13px] font-semibold text-rose-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-midnight text-gold font-semibold text-sm tracking-wide hover:bg-midnight-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
