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
  color: string;
}

interface PendingApproval {
  id: string;
  type: "loan" | "withdrawal" | "account";
  member: string;
  amount: string;
  requestedAt: string;
  priority: "high" | "medium" | "low";
}

// ─── Mock data (replaced by live API when backend is online) ──────────────────
const KPI_CARDS: KpiCard[] = [
  {
    label: "Total Members",
    value: "1,248",
    sub: "Active accounts",
    icon: "👥",
    trend: "up",
    trendValue: "+34 this month",
    color: "#3B82F6",
  },
  {
    label: "Total Savings",
    value: "ETB 4.2M",
    sub: "Across all accounts",
    icon: "💰",
    trend: "up",
    trendValue: "+8.3% vs last month",
    color: "#10B981",
  },
  {
    label: "Loan Portfolio",
    value: "ETB 2.8M",
    sub: "Outstanding balance",
    icon: "📋",
    trend: "up",
    trendValue: "ETB 980K disbursed this month",
    color: "#F59E0B",
  },
  {
    label: "Repayment Rate",
    value: "94.7%",
    sub: "On-time payments",
    icon: "✅",
    trend: "up",
    trendValue: "+1.2% vs last month",
    color: "#8B5CF6",
  },
  {
    label: "Pending Approvals",
    value: "12",
    sub: "Awaiting authorization",
    icon: "⏳",
    trend: "neutral",
    trendValue: "5 high priority",
    color: "#EF4444",
  },
  {
    label: "Share Capital",
    value: "ETB 1.1M",
    sub: "Total share holdings",
    icon: "📊",
    trend: "up",
    trendValue: "+ETB 42K this month",
    color: "#06B6D4",
  },
];

const PENDING_APPROVALS: PendingApproval[] = [
  {
    id: "A-001",
    type: "loan",
    member: "Alem Bekele",
    amount: "ETB 150,000",
    requestedAt: "Today, 09:14 AM",
    priority: "high",
  },
  {
    id: "A-002",
    type: "withdrawal",
    member: "Tigist Haile",
    amount: "ETB 45,000",
    requestedAt: "Today, 10:02 AM",
    priority: "high",
  },
  {
    id: "A-003",
    type: "loan",
    member: "Solomon Girma",
    amount: "ETB 80,000",
    requestedAt: "Yesterday, 03:30 PM",
    priority: "medium",
  },
  {
    id: "A-004",
    type: "account",
    member: "Hiwot Tadesse",
    amount: "—",
    requestedAt: "Yesterday, 11:45 AM",
    priority: "low",
  },
  {
    id: "A-005",
    type: "loan",
    member: "Dawit Mengistu",
    amount: "ETB 200,000",
    requestedAt: "Aug 23, 2026",
    priority: "high",
  },
];

const RECENT_TRANSACTIONS = [
  { member: "Meron Alemu", type: "Savings Deposit", amount: "+ETB 10,000", time: "2 hrs ago", status: "completed" },
  { member: "Yonas Tesfaye", type: "Loan Repayment", amount: "+ETB 8,500", time: "4 hrs ago", status: "completed" },
  { member: "Selamawit Kebede", type: "Loan Disbursement", amount: "-ETB 75,000", time: "6 hrs ago", status: "completed" },
  { member: "Bereket Alemu", type: "Withdrawal", amount: "-ETB 5,000", time: "1 day ago", status: "completed" },
  { member: "Rahel Desta", type: "Share Purchase", amount: "+ETB 3,000", time: "1 day ago", status: "completed" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCardItem({ card }: { card: KpiCard }) {
  return (
    <div
      style={{
        background: "var(--color-surface, #0f172a)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: card.color,
          borderRadius: "12px 0 0 12px",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{card.label}</span>
        <span style={{ fontSize: 22 }}>{card.icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{card.value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{card.sub}</div>
      <div
        style={{
          fontSize: 11,
          color: card.trend === "up" ? "#34D399" : card.trend === "down" ? "#F87171" : "rgba(255,255,255,0.4)",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {card.trend === "up" ? "↑" : card.trend === "down" ? "↓" : "•"} {card.trendValue}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: PendingApproval["priority"] }) {
  const map = {
    high: { bg: "rgba(239,68,68,0.15)", color: "#F87171", label: "High" },
    medium: { bg: "rgba(245,158,11,0.15)", color: "#FCD34D", label: "Medium" },
    low: { bg: "rgba(16,185,129,0.15)", color: "#34D399", label: "Low" },
  };
  const s = map[priority];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 99,
      }}
    >
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: PendingApproval["type"] }) {
  const map = {
    loan: { bg: "rgba(139,92,246,0.15)", color: "#A78BFA", label: "🏦 Loan" },
    withdrawal: { bg: "rgba(249,115,22,0.15)", color: "#FB923C", label: "💸 Withdrawal" },
    account: { bg: "rgba(6,182,212,0.15)", color: "#67E8F9", label: "👤 Account" },
  };
  const s = map[type];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 99,
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TenantAdminDashboardPage() {
  const [user, setUser] = useState<{ fullName?: string; tenantId?: string | null } | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [approved, setApproved] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  useEffect(() => {
    const u = getSessionUser();
    if (u) setUser(u);
  }, []);

  function handleApprove(id: string) {
    setApproving(id);
    setTimeout(() => {
      setApproved((p) => [...p, id]);
      setApproving(null);
    }, 700);
  }

  function handleReject(id: string) {
    setApproving(id);
    setTimeout(() => {
      setRejected((p) => [...p, id]);
      setApproving(null);
    }, 700);
  }

  const pendingItems = PENDING_APPROVALS.filter(
    (a) => !approved.includes(a.id) && !rejected.includes(a.id)
  );

  const cardBase: React.CSSProperties = {
    background: "var(--color-surface, #0f172a)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "20px 24px",
  };

  return (
    <main style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--color-gold, #C59B27)",
              textTransform: "uppercase",
            }}
          >
            Biruk · Task 21
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>
          Executive Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 4 }}>
          {user?.fullName ? `Welcome back, ${user.fullName}` : "Welcome back"} — here's your SACCO at a glance.
        </p>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {KPI_CARDS.map((card) => (
          <KpiCardItem key={card.label} card={card} />
        ))}
      </div>

      {/* ── Lower Row ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

        {/* Pending Approvals */}
        <div style={cardBase}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>
              ⏳ Pending Approvals
            </h2>
            <span
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#F87171",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 10px",
                borderRadius: 99,
              }}
            >
              {pendingItems.length} pending
            </span>
          </div>

          {pendingItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "rgba(255,255,255,0.3)",
                fontSize: 14,
              }}
            >
              ✅ All caught up — no pending approvals!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <TypeBadge type={item.type} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}
                    >
                      {item.member}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <span>{item.amount}</span>
                      <span>·</span>
                      <span>{item.requestedAt}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={approving === item.id}
                      style={{
                        padding: "5px 12px",
                        background: "rgba(16,185,129,0.15)",
                        color: "#34D399",
                        border: "1px solid rgba(52,211,153,0.3)",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: approving === item.id ? 0.5 : 1,
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={approving === item.id}
                      style={{
                        padding: "5px 12px",
                        background: "rgba(239,68,68,0.1)",
                        color: "#F87171",
                        border: "1px solid rgba(248,113,113,0.2)",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: approving === item.id ? 0.5 : 1,
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recent Transactions */}
          <div style={cardBase}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 14px" }}>
              🔄 Recent Transactions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RECENT_TRANSACTIONS.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: i < RECENT_TRANSACTIONS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{t.member}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      {t.type} · {t.time}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.amount.startsWith("+") ? "#34D399" : "#F87171",
                    }}
                  >
                    {t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={cardBase}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "0 0 14px" }}>
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
                    display: "block",
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8,
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(197,155,39,0.12)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#C59B27";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)";
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
  );
}
