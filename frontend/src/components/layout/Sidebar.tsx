'use client';

import React from "react";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Landmark,
  CreditCard,
  FileBarChart2,
  Share2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "transaction", label: "Transaction", icon: FolderOpen },
  { id: "loan", label: "Loan", icon: Landmark },
  { id: "account", label: "Account", icon: CreditCard },
  { id: "report", label: "Report", icon: FileBarChart2 },
  { id: "social", label: "Social", icon: Share2 },
];

export function Sidebar({ activeNav, setActiveNav, isOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="dashboard-sidebar"
        aria-expanded={isOpen}
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen shrink-0 bg-[#1c1d22] border-r border-[#282a32] flex flex-col justify-between transition-all duration-300 ease-in-out select-none overflow-hidden",
          isOpen
            ? "w-64 translate-x-0 opacity-100 visible"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 pointer-events-none border-r-0 invisible md:visible"
        )}
      >
        {/* Inner Fixed Container so contents don't wrap during animation */}
        <div className="w-64 min-w-[16rem] flex flex-col h-full justify-between">
          {/* Brand Header */}
          <div className="p-4 border-b border-[#282a32]/60">
            <div className="flex items-center gap-3">
              {/* Custom Starburst Icon */}
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 p-0.5 shadow-md shadow-sky-500/20">
                <div className="w-full h-full bg-[#1c1d22] rounded-[6px] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-sky-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="font-bold tracking-tight text-white text-base">Sacco</span>
              </div>
            </div>
          </div>

          {/* Navigation List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setActiveNav(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-[#282a32] text-white shadow-xs border border-[#353944]"
                      : "text-[#8e95a5] hover:text-[#e2e8f0] hover:bg-[#23242a]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        isActive ? "text-white" : "text-[#717888] group-hover:text-white"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-xs shadow-sky-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
