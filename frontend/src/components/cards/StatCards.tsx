'use client';

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatItem {
  id: string;
  title: string;
  value: string;
  variant: "blue" | "dark";
  change?: string;
}

interface StatCardsProps {
  stats?: StatItem[];
  onCardClick?: (id: string) => void;
}

const defaultStats: StatItem[] = [
  {
    id: "total-members",
    title: "Views",
    value: "7,265",
    variant: "blue",
    change: "+11.01%",
  },
  {
    id: "total-savings",
    title: "Visits",
    value: "3,671",
    variant: "dark",
    change: "-0.03%",
  },
  {
    id: "active-loans",
    title: "New Users",
    value: "256",
    variant: "blue",
    change: "+15.03%",
  },
  {
    id: "total-assets",
    title: "Active Users",
    value: "2,318",
    variant: "dark",
    change: "+6.08%",
  },
];

export function StatCards({ stats = defaultStats, onCardClick }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {stats.map((stat, index) => {
        const isBlue = stat.variant === "blue" || index === 0 || index === 2;
        const isNegative = stat.change?.startsWith("-");

        return (
          <div
            key={stat.id}
            id={`stat-card-${stat.id}`}
            onClick={() => onCardClick?.(stat.id)}
            className={cn(
              "stat-card-item relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[105px]",
              isBlue
                ? "bg-[#1c77ff] text-white shadow-blue-500/10"
                : "bg-[#1c1d22] text-white shadow-black/10"
            )}
          >
            {/* Top row: Title on left, Trend badge pill on right */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium tracking-tight text-white/80">
                {stat.title}
              </span>

              {/* Trend Pill */}
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium backdrop-blur-xs",
                  isBlue
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-white/90"
                )}
              >
                {isNegative ? (
                  <ArrowDownRight className="w-3 h-3 text-red-300 stroke-[2.5]" />
                ) : (
                  <ArrowUpRight className="w-3 h-3 text-emerald-300 stroke-[2.5]" />
                )}
                <span>{stat.change || "+0.00%"}</span>
              </div>
            </div>

            {/* Bottom: Main Value */}
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white font-sans">
                {stat.value}
              </h2>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatCards;
