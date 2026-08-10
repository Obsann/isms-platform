"use client";

import React from "react";
import StatusBadge from "@/components/badges/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Member } from "@/types";

interface MemberProfileViewProps {
  member: Member;
  onEdit?: () => void;
  onBack?: () => void;
}

const idTypeLabels: Record<string, string> = {
  national_id: "National ID",
  passport: "Passport",
  other: "Other ID",
};

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  member,
  onEdit,
  onBack,
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return "-";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      {/* Header Banner Area */}
      <div className="bg-midnight px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-gold/60">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {member.fullName}
            </h2>
            <StatusBadge status={member.status} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-light/70">
            Member Number: {member.memberNumber}
          </p>
        </div>

        <div className="flex gap-2.5">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="text-white border-white/20 hover:bg-white/10 hover:text-white"
            >
              ← Back
            </Button>
          )}
          {onEdit && (
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="bg-gold hover:bg-gold/90 text-midnight font-bold shadow-sm"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="p-8 flex flex-col gap-8">
        {/* Section 1: Personal Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-4 border-b border-slate-100 pb-1">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                First Name
              </span>
              <span className="text-sm font-medium text-slate-800">
                {member.firstName}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Middle Name
              </span>
              <span className="text-sm font-medium text-slate-800">
                {member.middleName || "-"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Last Name
              </span>
              <span className="text-sm font-medium text-slate-800">
                {member.lastName}
              </span>
            </div>
            <div className="mt-2">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Date of Birth
              </span>
              <span className="text-sm font-medium text-slate-800">
                {formatDate(member.dateOfBirth)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Identification Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-4 border-b border-slate-100 pb-1">
            Identification Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                ID Type
              </span>
              <span className="text-sm font-medium text-slate-800">
                {member.idType ? idTypeLabels[member.idType] || member.idType : "No ID provided"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                ID Number
              </span>
              <span className="text-sm font-medium text-slate-800">
                {member.nationalId || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Contact Details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-4 border-b border-slate-100 pb-1">
            Contact Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Phone Number
              </span>
              <span className="text-sm font-medium text-slate-800">
                {member.phone || "-"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Email Address
              </span>
              <span className="text-sm font-medium text-slate-800">
                {member.email || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Membership Dates */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 mb-4 border-b border-slate-100 pb-1">
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Joined Date
              </span>
              <span className="text-sm font-medium text-slate-800">
                {formatDate(member.joinedAt)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Created At
              </span>
              <span className="text-sm font-medium text-slate-800">
                {formatDateTime(member.createdAt)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
                Last Updated At
              </span>
              <span className="text-sm font-medium text-slate-800">
                {formatDateTime(member.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileView;
