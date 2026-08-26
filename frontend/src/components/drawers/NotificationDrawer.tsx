'use client';

import React from "react";
import { X, Bell, CheckCheck, Trash2, Landmark, ShieldCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SaccoNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "deposit" | "kyc" | "loan" | "system";
  unread: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SaccoNotification[];
  onMarkAllAsRead: () => void;
  onDismissNotification: (id: string) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onDismissNotification,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1c1d22] border-l border-[#282a32] h-full shadow-2xl flex flex-col justify-between z-10 text-[#e2e8f0]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#282a32] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              System Notifications
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8e95a5] hover:text-white hover:bg-[#282a32] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#717888]">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-colors flex items-start justify-between gap-3 group",
                  n.unread
                    ? "bg-[#23242a] border-sky-500/30"
                    : "bg-[#18191d] border-[#282a32] opacity-75"
                )}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{n.title}</span>
                    <span className="text-[10px] text-[#717888] shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#8e95a5] leading-relaxed">{n.description}</p>
                </div>
                <button
                  onClick={() => onDismissNotification(n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#717888] hover:text-rose-400 transition-opacity"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282a32] bg-[#1a1b20] flex items-center justify-between text-xs text-[#717888]">
          <span>{notifications.filter((n) => n.unread).length} unread alerts</span>
          <button onClick={onClose} className="text-sky-400 font-semibold hover:underline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationDrawer;
