"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionUser, portalHome } from "@/lib/api-client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getSessionUser();
    router.replace(user ? portalHome(user.role) : "/login");
  }, [router]);

  return <div className="min-h-screen bg-midnight" aria-hidden="true" />;
}
