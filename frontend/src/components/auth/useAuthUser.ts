"use client";

import { useSyncExternalStore } from "react";
import { getSessionUser } from "@/lib/api-client";
import type { AuthUser } from "@/types";

let cachedKey = "";
let cachedUser: AuthUser | null = null;

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("isms-auth-changed", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("isms-auth-changed", onStoreChange);
  };
}

function getSnapshot(): AuthUser | null {
  const key = `${localStorage.getItem("isms_access_token") ?? ""}:${localStorage.getItem("isms_auth_user") ?? ""}`;
  if (key === cachedKey) return cachedUser;
  cachedKey = key;
  cachedUser = getSessionUser();
  return cachedUser;
}

function getServerSnapshot(): AuthUser | null {
  return null;
}

export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function formatRoleLabel(role: string): string {
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
