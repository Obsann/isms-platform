"use client";

import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KpiCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  accent: string;
}

interface PendingApproval {
  id: string;
  type: "loan" | "withdrawal" | "account";
  member: string;
  amount: string;
  requestedAt: string;
  priority: "high" | "medium" | "low";
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const KPI_CARDS: KpiCard[] = [
  { label: "Total Members", value: "1,248", sub: "Active accounts", icon: "👥", trend: "up", trendValue: "+34 this month", accent: "#2563eb" },
  { label: "Total Savings", value: "ETB 4.2M", sub: "Across all accounts", icon: "💰", trend: "up", trendValue: "+8.3% vs last month", accent: "#16a34a" },
  { label: "Loan Portfolio", value: "ETB 2.8M", sub: "Outstanding balance", icon: "📋", trend: "up", trendValue: "ETB 980K disbursed this month", accent: "#d97706" },
  { label: "Repayment Rate", value: "94.7%", sub: "On-time payments", icon: "✅", trend: "up", trendValue: "+1.2% vs last month", accent: "#7c3aed" },
  { label: "Pending Approvals", value: "12", sub: "Awaiting authorization", icon: "⏳", trend: "neutral", trendValue: "5 high priority", accent: "#dc2626" },
  { label: "Share Capital", value: "ETB 1.1M", sub: "Total share holdings", icon: "📊", trend: "up", trendValue: "+ETB 42K this month", accent: "#0891b2" },
];

const PENDING_APPROVALS: PendingApproval[] = [
  { id: "A-001", type: "loan", member: "Alem Bekele", amount: "ETB 150,000", requestedAt: "Today, 09:14 AM", priority: "high" },
  { id: "A-002", type: "withdrawal", member: "Tigist Haile", amount: "ETB 45,000", requestedAt: "Today, 10:02 AM", priority: "high" },
  { id: "A-003", type: "loan", member: "Solomon Girma", amount: "ETB 80,000", requestedAt: "Yesterday, 03:30 PM", priority: "medium" },
  { id: "A-004", type: "account", member: "Hiwot Tadesse", amount: "—", requestedAt: "Yesterday, 11:45 AM", priority: "low" },
  { id: "A-005", type: "loan", member: "Dawit Mengistu", amount: "ETB 200,000", requestedAt: "Aug 23, 2026", priority: "high" },
];

const RECENT_TRANSACTIONS = [
  { member: "Meron Alemu", type: "Savings Deposit", amount: "+ETB 10,000", time: "2 hrs ago", positive: true },
  { member: "Yonas Tesfaye", type: "Loan Repayment", amount: "+ETB 8,500", time: "4 hrs ago", positive: true },
  { member: "Selamawit Kebede", type: "Loan Disbursement", amount: "-ETB 75,000", time: "6 hrs ago", positive: false },
  { member: "Bereket Alemu", type: "Withdrawal", amount: "-ETB 5,000", time: "1 day ago", positive: false },
  { member: "Rahel Desta", type: "Share Purchase", amount: "+ETB 3,000", time: "1 day ago", positive: true },
];

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#f2f4f7",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  textSub: "#94a3b8",
  cardShadow: "0 1px 4px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.05)",
  gold: "#C59B27",
};

const DARK = {
  bg: "#0b1222",
  surface: "#0f1a2e",
  surfaceAlt: "#1a2540",
  border: "rgba(255,255,255,0.08)",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  textSub: "#64748b",
  cardShadow: "0 2px 8px rgba(0,0,0,0.4)",
  gold: "#D8B138",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenantAdminDashboardPage() {
  const [user, setUser] = useState<{ fullName?: string } | null>(null);
  const [dark, setDark] = useState(false);
  const [approved, setApproved] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const u = getSessionUser();
    if (u) setUser(u);
    // Respect system preference on first load
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(prefersDark);
  }, []);

  const t = dark ? DARK : LIGHT;

  function handleApprove(id: string) {
    setActing(id);
    setTimeout(() => { setApproved((p) => [...p, id]); setActing(null); }, 600);
  }
  function handleReject(id: string) {
    setActing(id);
    setTimeout(() => { setRejected((p) => [...p, id]); setActing(null); }, 600);
  }

  const pendingItems = PENDING_APPROVALS.filter(
    (a) => !approved.includes(a.id) && !rejected.includes(a.id)
  );

  const TYPE_CONFIG = {
    loan: { bg: dark ? "rgba(124,58,237,0.18)" : "#ede9fe", color: dark ? "#a78bfa" : "#6d28d9", label: "🏦 Loan" },
    withdrawal: { bg: dark ? "rgba(234,88,12,0.18)" : "#ffedd5", color: dark ? "#fb923c" : "#c2410c", label: "💸 Withdrawal" },
    account: { bg: dark ? "rgba(8,145,178,0.18)" : "#cffafe", color: dark ? "#67e8f9" : "#0e7490", label: "👤 Account" },
  };
  const PRIORITY_CONFIG = {
    high: { bg: dark ? "rgba(220,38,38,0.18)" : "#fee2e2", color: dark ? "#f87171" : "#b91c1c", label: "High" },
    medium: { bg: dark ? "rgba(217,119,6,0.18)" : "#fef3c7", color: dark ? "#fcd34d" : "#92400e", label: "Medium" },
    low: { bg: dark ? "rgba(22,163,74,0.18)" : "#dcfce7", color: dark ? "#4ade80" : "#15803d", label: "Low" },
  };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", transition: "background 0.25s" }}>

      {/* ── Dark mode toggle — sits just below header, right side ── */}
      <button
        onClick={() => setDark((d) => !d)}
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          position: "fixed",
          top: 68,
          right: 20,
          zIndex: 900,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          background: dark ? "#1a2540" : "#ffffff",
          border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "#d1d5db"}`,
          borderRadius: 20,
          cursor: "pointer",
          color: dark ? "#f1f5f9" : "#0f172a",
          fontSize: 12,
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: 13 }}>{dark ? "☀️" : "🌙"}</span>
        {dark ? "Light" : "Dark"}
      </button>

      <main style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: t.gold, textTransform: "uppercase", marginBottom: 6 }}>
            Biruk · Task 21
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: t.text, margin: 0, fontFamily: "inherit" }}>
            Executive Dashboard
          </h1>
          <p style={{ color: t.textMuted, fontSize: 14, marginTop: 4 }}>
            {user?.fullName ? `Welcome back, ${user.fullName}` : "Welcome back"} — here's your SACCO at a glance.
          </p>
        </div>

        {/* ── KPI Grid ──────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}>
          {KPI_CARDS.map((card) => (
            <div
              key={card.label}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: "18px 20px",
                boxShadow: t.cardShadow,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {/* Accent bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, width: 3, height: "100%",
                background: card.accent, borderRadius: "12px 0 0 12px",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {card.label}
                </span>
                <span style={{ fontSize: 20 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: t.text, lineHeight: 1.1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 12, color: t.textSub }}>{card.sub}</div>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: card.trend === "up" ? "#16a34a" : card.trend === "down" ? "#dc2626" : t.textMuted,
                display: "flex", alignItems: "center", gap: 3,
              }}>
                {card.trend === "up" ? "↑" : card.trend === "down" ? "↓" : "•"} {card.trendValue}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom Row ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "flex-start" }}>

          {/* Pending Approvals */}
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: "20px 24px", boxShadow: t.cardShadow,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: 0, fontFamily: "inherit" }}>
                ⏳ Pending Approvals
              </h2>
              <span style={{
                background: dark ? "rgba(220,38,38,0.18)" : "#fee2e2",
                color: dark ? "#f87171" : "#b91c1c",
                fontSize: 11, fontWeight: 700,
                padding: "3px 10px", borderRadius: 99,
              }}>
                {pendingItems.length} pending
              </span>
            </div>

            {pendingItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: t.textMuted, fontSize: 14 }}>
                ✅ All caught up — no pending approvals!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingItems.map((item) => {
                  const tc = TYPE_CONFIG[item.type];
                  const pc = PRIORITY_CONFIG[item.priority];
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: t.surfaceAlt,
                        border: `1px solid ${t.border}`,
                        borderRadius: 8, padding: "12px 14px",
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 12,
                        transition: "opacity 0.3s",
                        opacity: acting === item.id ? 0.5 : 1,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>
                            {tc.label}
                          </span>
                          <span style={{ background: pc.bg, color: pc.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>
                            {pc.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 3 }}>
                          {item.member}
                        </div>
                        <div style={{ fontSize: 12, color: t.textMuted, display: "flex", gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{item.amount}</span>
                          <span>·</span>
                          <span>{item.requestedAt}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={acting === item.id}
                          style={{
                            padding: "5px 12px",
                            background: dark ? "rgba(22,163,74,0.15)" : "#dcfce7",
                            color: dark ? "#4ade80" : "#15803d",
                            border: `1px solid ${dark ? "rgba(74,222,128,0.3)" : "#86efac"}`,
                            borderRadius: 6, fontSize: 12, fontWeight: 700,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={acting === item.id}
                          style={{
                            padding: "5px 12px",
                            background: dark ? "rgba(220,38,38,0.12)" : "#fee2e2",
                            color: dark ? "#f87171" : "#b91c1c",
                            border: `1px solid ${dark ? "rgba(248,113,113,0.25)" : "#fca5a5"}`,
                            borderRadius: 6, fontSize: 12, fontWeight: 700,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Recent Transactions */}
            <div style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: "20px 24px", boxShadow: t.cardShadow,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: "0 0 14px", fontFamily: "inherit" }}>
                🔄 Recent Transactions
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {RECENT_TRANSACTIONS.map((tx, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "10px 0",
                      borderBottom: i < RECENT_TRANSACTIONS.length - 1 ? `1px solid ${t.border}` : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{tx.member}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{tx.type} · {tx.time}</div>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: tx.positive ? (dark ? "#4ade80" : "#15803d") : (dark ? "#f87171" : "#b91c1c"),
                    }}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: "20px 24px", boxShadow: t.cardShadow,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: "0 0 14px", fontFamily: "inherit" }}>
                ⚡ Quick Actions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "📊 View Financial Reports", href: "/tenant-admin/reports" },
                  { label: "👥 Manage Members", href: "/tenant-admin/members" },
                  { label: "⚙️ Portal Settings", href: "/tenant-admin/settings" },
                ].map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    style={{
                      display: "block", padding: "10px 14px",
                      background: t.surfaceAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 8, color: t.text,
                      fontSize: 13, fontWeight: 500,
                      textDecoration: "none", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = t.gold;
                      (e.currentTarget as HTMLAnchorElement).style.color = t.gold;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = t.border;
                      (e.currentTarget as HTMLAnchorElement).style.color = t.text;
                    }}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
