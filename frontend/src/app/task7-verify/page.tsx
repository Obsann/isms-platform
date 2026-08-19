'use client';

import React, { useState, useEffect } from "react";
import { Sidebar, navItems } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StatCards } from "@/components/cards/StatCards";
import { AnalyticsChart } from "@/components/charts/AnalyticsChart";
import { FormFieldGroup } from "@/components/forms/FormFieldGroup";
import { StatusBadgesCard } from "@/components/badges/StatusBadgesCard";
import { DataTable, initialMembersData } from "@/components/tables/DataTable";
import { MemberPortalView } from "@/components/views/MemberPortalView";
import { NotificationDrawer, SaccoNotification } from "@/components/drawers/NotificationDrawer";
import { AuditHistoryDrawer } from "@/components/drawers/AuditHistoryDrawer";
import { SearchModal } from "@/components/drawers/SearchModal";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MemberRecord } from "@/types/dashboard";
import {
  TransactionsView,
  LoansView,
  AccountsView,
  ReportsView,
  SocialView,
} from "@/components/views/OtherViews";

const initialNotificationsList: SaccoNotification[] = [
  {
    id: "n-1",
    title: "Large Deposit Completed",
    description: "Orlando Diggs deposited 95,300.00 ETB via Commercial Bank of Ethiopia.",
    time: "10 mins ago",
    type: "deposit",
    unread: true,
  },
  {
    id: "n-2",
    title: "KYC Verification Approved",
    description: "National ID verification confirmed for Drew Cano (M-003).",
    time: "1 hour ago",
    type: "kyc",
    unread: true,
  },
  {
    id: "n-3",
    title: "Pending Loan Review",
    description: "Agricultural expansion credit requires branch manager clearance.",
    time: "3 hours ago",
    type: "loan",
    unread: false,
  },
];

function Task7VerifyDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>(initialMembersData);
  const [notifications, setNotifications] = useState<SaccoNotification[]>(initialNotificationsList);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddMember = (newRecord: Partial<MemberRecord>) => {
    const fullRecord: MemberRecord = {
      id: newRecord.id || `rec-${Date.now()}`,
      name: newRecord.name || "New Member",
      avatar:
        newRecord.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      memberId: newRecord.memberId || `M-00${members.length + 1}`,
      savingAmount: newRecord.savingAmount || 1200.0,
      status: newRecord.status || "In Review",
      phone: newRecord.phone,
      idType: newRecord.idType,
      idNumber: newRecord.idNumber,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setMembers((prev) => [fullRecord, ...prev]);

    const newNotif: SaccoNotification = {
      id: `n-${Date.now()}`,
      title: "New Member Enrolled",
      description: `${fullRecord.name} was successfully enrolled into Sacco records.`,
      time: "Just now",
      type: "kyc",
      unread: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast("Member Registered", `${fullRecord.name} (${fullRecord.memberId}) was added.`);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    showToast("Record Removed", "The member record was removed from the ledger.");
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast("Notifications Cleared", "All alerts marked as read.");
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleToggleFavorite = (isFav: boolean) => {
    if (isFav) {
      showToast("Added to Favorites", `Starred ${getActiveNavTitle()} for quick access.`);
    } else {
      showToast("Removed from Favorites", `Unstarred ${getActiveNavTitle()}.`);
    }
  };

  const totalSavingsSum = members.reduce((acc, curr) => acc + curr.savingAmount, 4820500);

  const dynamicStats = [
    {
      id: "total-members",
      title: "Total members",
      value: (1265 + (members.length - 5)).toLocaleString(),
      variant: "blue" as const,
      change: "+12.4%",
    },
    {
      id: "total-savings",
      title: "Total Savings",
      value: `${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalSavingsSum)} ETB`,
      variant: "dark" as const,
      change: "+8.1%",
    },
    {
      id: "active-loans",
      title: "Active loans",
      value: "347",
      variant: "blue" as const,
      change: "+3.2%",
    },
    {
      id: "total-assets",
      title: "Total Assets",
      value: "12,650,000.00 ETB",
      variant: "dark" as const,
      change: "+15.6%",
    },
  ];

  const getActiveNavTitle = () => {
    const found = navItems.find((n) => n.id === activeNav);
    return found ? found.label : "Overview";
  };

  const renderMainContent = () => {
    switch (activeNav) {
      case "members":
        return <MemberPortalView members={members} />;
      case "transaction":
        return <TransactionsView />;
      case "loan":
        return <LoansView />;
      case "account":
        return <AccountsView />;
      case "report":
        return <ReportsView />;
      case "social":
        return <SocialView />;
      case "overview":
      default:
        return (
          <>
            <section aria-label="Key Performance Indicators">
              <StatCards stats={dynamicStats} />
            </section>

            <section aria-label="Savings, Loans &amp; Members Trends">
              <AnalyticsChart />
            </section>

            <section
              aria-label="Form and Status Showcase"
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              <FormFieldGroup onAddMember={handleAddMember} />
              <StatusBadgesCard
                selectedStatus={statusFilter}
                onSelectStatusFilter={setStatusFilter}
              />
            </section>

            <section aria-label="Members and Savings Data Table">
              <DataTable
                members={members}
                statusFilter={statusFilter}
                onDeleteMember={handleDeleteMember}
              />
            </section>
          </>
        );
    }
  };

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-[#18191d] text-[#e2e8f0] flex transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen justify-between">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenHistory={() => setIsAuditOpen(true)}
          isSidebarOpen={isSidebarOpen}
          notificationCount={unreadNotifCount}
          activeNavTitle={getActiveNavTitle()}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Dashboard Main Canvas */}
        <main className="flex-1 p-3.5 sm:p-5 max-w-[1360px] w-full mx-auto space-y-4">
          {renderMainContent()}
        </main>

        {/* Sticky Bottom Footer */}
        <Footer />
      </div>

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onDismissNotification={handleDismissNotification}
      />

      {/* Slide-over Audit & Activity History Drawer */}
      <AuditHistoryDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* Command & Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        members={members}
        onSelectNav={(navId) => {
          setActiveNav(navId);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 toast-slide-enter bg-[#23242a] border border-sky-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0 animate-ping" />
          <div>
            <div className="text-xs font-semibold text-white">{toastMessage.title}</div>
            <div className="text-[11px] text-[#8e95a5]">{toastMessage.desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Task7VerifyPage() {
  return (
    <ThemeProvider>
      <Task7VerifyDashboard />
    </ThemeProvider>
  );
}
