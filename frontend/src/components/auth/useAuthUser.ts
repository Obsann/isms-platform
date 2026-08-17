"use client";

import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/api-client";
import type { AuthUser } from "@/types";

export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  return user;
}

export function formatRoleLabel(role: string): string {
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
