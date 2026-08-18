'use client';

import React, { useState } from "react";
import {
  Star,
  Search,
  Sun,
  Moon,
  History,
  Bell,
  PanelLeft,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenHistory: () => void;
  isSidebarOpen?: boolean;
  notificationCount?: number;
  activeNavTitle?: string;
  onToggleFavorite?: (favorited: boolean) => void;
}

export function Header({
  onToggleSidebar,
  onOpenSearch,
  onOpenNotifications,
  onOpenHistory,
  isSidebarOpen = true,
  notificationCount = 3,
  activeNavTitle = "Overview",
  onToggleFavorite,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [isStarred, setIsStarred] = useState(false);

  const handleStarClick = () => {
    const newState = !isStarred;
    setIsStarred(newState);
    if (onToggleFavorite) onToggleFavorite(newState);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#1c1d22]/90 light:bg-white/90 backdrop-blur-md border-b border-[#282a32] light:border-[#e2e8f0] px-3.5 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 transition-colors">
      {/* Left section: Collapsible Sidebar Toggle, Star, Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Collapsible Sidebar Toggle Button */}
        <button
          id="btn-sidebar-toggle"
          onClick={onToggleSidebar}
          className={cn(
            "p-1.5 sm:p-2 rounded-lg transition-all duration-150 focus:outline-hidden group",
            isSidebarOpen
              ? "text-[#8e95a5] light:text-[#64748b] hover:text-white light:hover:text-black hover:bg-[#282a32] light:hover:bg-[#f1f5f9]"
              : "text-sky-400 bg-sky-500/10 hover:bg-sky-500/20"
          )}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="w-4 h-4 transition-transform group-hover:scale-105" />
        </button>

        {/* Favorite / Star Button */}
        <button
          id="btn-star-favorite"
          onClick={handleStarClick}
          className={cn(
            "p-1.5 sm:p-2 rounded-lg transition-colors focus:outline-hidden",
            isStarred
              ? "text-amber-400 bg-amber-400/10 shadow-xs shadow-amber-500/20"
              : "text-[#8e95a5] light:text-[#64748b] hover:text-white light:hover:text-black hover:bg-[#282a32] light:hover:bg-[#f1f5f9]"
          )}
          title={isStarred ? "Favorited (Click to remove)" : "Star / Favorite this view"}
        >
          <Star className={cn("w-4 h-4", isStarred && "fill-amber-400")} />
        </button>

        {/* Breadcrumb path */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <span className="text-[#8e95a5] light:text-[#64748b] hover:text-white light:hover:text-black transition-colors cursor-pointer font-medium">
            Dashboards
          </span>
          <span className="text-[#4b5262] light:text-[#94a3b8]">/</span>
          <span className="text-white light:text-[#0f172a] font-semibold tracking-tight">
            {activeNavTitle}
          </span>
        </nav>
      </div>

      {/* Right section: Search bar, theme, history, notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar matching Figma's minimalist pill */}
        <div
          onClick={onOpenSearch}
          className="relative hidden sm:flex items-center cursor-pointer group"
        >
          <div className="relative flex items-center w-40 md:w-56 bg-[#23242a] light:bg-[#f1f5f9] border border-[#2f323c] light:border-[#cbd5e1] rounded-lg px-2.5 py-1.5 group-hover:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500/30 transition-all">
            <Search className="w-3.5 h-3.5 text-[#6c7486] light:text-[#94a3b8] mr-2 shrink-0 group-hover:text-sky-400 transition-colors" />
            <span className="w-full text-xs text-[#6c7486] light:text-[#94a3b8] truncate">
              Search Sacco...
            </span>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#717888] light:text-[#64748b] bg-[#1a1b20] light:bg-white border border-[#353844] light:border-[#cbd5e1] rounded shrink-0">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Mobile search icon button */}
        <button
          id="btn-mobile-search"
          onClick={onOpenSearch}
          className="sm:hidden p-1.5 rounded-lg text-[#8e95a5] light:text-[#64748b] hover:text-white light:hover:text-black hover:bg-[#282a32] light:hover:bg-[#f1f5f9] transition-colors focus:outline-hidden"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Light / Dark Mode Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg text-[#8e95a5] light:text-[#64748b] hover:text-white light:hover:text-black hover:bg-[#282a32] light:hover:bg-[#f1f5f9] transition-colors focus:outline-hidden relative group"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Light / Dark Mode"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* History / Audit Log view */}
          <button
            id="btn-history-view"
            onClick={onOpenHistory}
            className="p-1.5 sm:p-2 rounded-lg text-[#8e95a5] light:text-[#64748b] hover:text-white light:hover:text-black hover:bg-[#282a32] light:hover:bg-[#f1f5f9] transition-colors focus:outline-hidden"
            title="Audit & Activity History"
            aria-label="Open Audit History"
          >
            <History className="w-4 h-4 hover:text-sky-400 transition-colors" />
          </button>

          {/* Notifications button */}
          <button
            id="btn-notifications"
            onClick={onOpenNotifications}
            className="relative p-1.5 sm:p-2 rounded-lg text-[#8e95a5] light:text-[#64748b] hover:text-white light:hover:text-black hover:bg-[#282a32] light:hover:bg-[#f1f5f9] transition-colors focus:outline-hidden"
            title="Notifications"
            aria-label="Open Notifications"
          >
            <Bell className="w-4 h-4 hover:text-sky-400 transition-colors" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-[#1c1d22] light:ring-white animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
