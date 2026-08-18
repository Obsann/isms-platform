'use client';

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotificationDrawer, SaccoNotification } from "@/components/drawers/NotificationDrawer";
import { AuditHistoryDrawer } from "@/components/drawers/AuditHistoryDrawer";
import { SearchModal } from "@/components/drawers/SearchModal";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initialMembersData } from "@/components/tables/DataTable";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export interface PortalShellProps {
  portalName?: string;
  portalBadgeColor?: 'super-admin' | 'tenant-admin' | 'teller' | 'member';
  navSections?: NavSection[];
  navItems?: NavItem[];
  user?: { name: string; role: string };
  showSidebar?: boolean;
  children: React.ReactNode;
  className?: string;
}

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

function InnerPortalShell({
  portalName,
  user,
  showSidebar = false,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const [activeNav, setActiveNav] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(showSidebar);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<SaccoNotification[]>(initialNotificationsList);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

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

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast("Notifications Cleared", "All alerts marked as read.");
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleToggleFavorite = (isFav: boolean) => {
    if (isFav) {
      showToast("Added to Favorites", `Starred ${portalName || "Dashboard"} for quick access.`);
    } else {
      showToast("Removed from Favorites", `Unstarred ${portalName || "Dashboard"}.`);
    }
  };

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-[#18191d] text-[#e2e8f0] flex transition-colors duration-200">
      {/* Sidebar — only rendered if showSidebar is true (Task 7 page) */}
      {showSidebar && (
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen justify-between">
        {/* Header */}
        <Header
          onToggleSidebar={() => showSidebar && setIsSidebarOpen(!isSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenHistory={() => setIsAuditOpen(true)}
          isSidebarOpen={showSidebar && isSidebarOpen}
          notificationCount={unreadNotifCount}
          activeNavTitle={portalName || "Overview"}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Content Area */}
        <main className="flex-1 p-3.5 sm:p-5 max-w-[1360px] w-full mx-auto space-y-4">
          {children}
        </main>

        {/* Footer */}
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
        members={initialMembersData}
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

export function PortalShell(props: PortalShellProps) {
  return (
    <ThemeProvider>
      <InnerPortalShell {...props} />
    </ThemeProvider>
  );
}

export default PortalShell;
