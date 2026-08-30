"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { portalHome } from "@/lib/api-client";
import { useAuthUser } from "@/components/auth/useAuthUser";
import { ROLE_PORTAL, type PortalName } from "@/types";

/**
 * Client-only UX gate. Backend JWT + RLS still enforce access; this just keeps
 * the wrong portal from flashing for a logged-in role, and sends anonymous
 * visitors to /login.
 */
export default function PortalGuard({
  portal,
  children,
}: {
  portal: PortalName;
  children: ReactNode;
}) {
  const router = useRouter();
  const user = useAuthUser();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (ROLE_PORTAL[user.role] !== portal) {
      router.replace(portalHome(user.role));
    }
  }, [portal, router, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold text-midnight flex items-center justify-center font-display text-[9px] font-bold tracking-wider animate-pulse">
            ISMS
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Loading portal</p>
        </div>
      </div>
    );
  }

  if (ROLE_PORTAL[user.role] !== portal) {
    return null;
  }

  return children;
}
