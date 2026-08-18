'use client';

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  LineChart as LineChartIcon,
  BarChart2,
  AreaChart as AreaChartIcon,
  Download,
  Check,
  TrendingUp,
} from "lucide-react";
import { cn, formatETB } from "@/lib/utils";

type ChartMetric = "savings" | "loans" | "members";
type Timeframe = "Week" | "Month" | "Quarter" | "Year";
type ChartStyle = "line" | "area" | "bar";

interface DataPoint {
  label: string;
  savings: number; // in ETB
  loans: number;
  members: number;
  normalizedY: number;
}

const timeframeDatasets: Record<Timeframe, DataPoint[]> = {
  Week: [
    { label: "Mon", savings: 410000, loans: 12, members: 8, normalizedY: 70 },
    { label: "Tue", savings: 590000, loans: 18, members: 15, normalizedY: 55 },
    { label: "Wed", savings: 320000, loans: 9, members: 6, normalizedY: 80 },
    { label: "Thu", savings: 980000, loans: 28, members: 22, normalizedY: 30 },
    { label: "Fri", savings: 850000, loans: 24, members: 19, normalizedY: 40 },
    { label: "Sat", savings: 640000, loans: 16, members: 11, normalizedY: 50 },
    { label: "Sun", savings: 430500, loans: 10, members: 7, normalizedY: 65 },
  ],
  Month: [
    { label: "Jan", savings: 2450000, loans: 180, members: 820, normalizedY: 68 },
    { label: "Feb", savings: 1980000, loans: 140, members: 790, normalizedY: 78 },
    { label: "Mar", savings: 2850000, loans: 210, members: 940, normalizedY: 67 },
    { label: "Apr", savings: 4820500, loans: 347, members: 1265, normalizedY: 26 },
    { label: "May", savings: 3650000, loans: 290, members: 1110, normalizedY: 48 },
    { label: "Jun", savings: 4210000, loans: 320, members: 1210, normalizedY: 42 },
  ],
  Quarter: [
    { label: "Q1 '25", savings: 7280000, loans: 530, members: 2550, normalizedY: 65 },
    { label: "Q2 '25", savings: 9450000, loans: 690, members: 3120, normalizedY: 50 },
    { label: "Q3 '25", savings: 11200000, loans: 810, members: 3800, normalizedY: 38 },
    { label: "Q4 '25", savings: 14800000, loans: 990, members: 4600, normalizedY: 22 },
  ],
  Year: [
    { label: "2023", savings: 18200000, loans: 1200, members: 5400, normalizedY: 75 },
    { label: "2024", savings: 29400000, loans: 1950, members: 8900, normalizedY: 52 },
    { label: "2025", savings: 42700000, loans: 3020, members: 13500, normalizedY: 34 },
    { label: "2026", savings: 61500000, loans: 4450, members: 19800, normalizedY: 18 },
  ],
};

export function AnalyticsChart() {
  const [activeTab, setActiveTab] = useState<ChartMetric>("savings");
  const [timeframe, setTimeframe] = useState<Timeframe>("Month");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("line");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(860);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width > 0 ? width : 860);
      }
    };

    updateSize();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener("resize", updateSize);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const currentData = timeframeDatasets[timeframe];

  const points = currentData.map((d, index) => {
    const step = containerWidth / (currentData.length - 1 || 1);
    const x = Math.min(Math.max(index * step, 16), containerWidth - 16);
    const y = 35 + (d.normalizedY / 100) * 120;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = a[i - 1];
    const cx = (prev.x + point.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0},180 L ${points[0]?.x || 0},180 Z`;

  const handleExportCSV = () => {
    const headers = "Label,Savings (ETB),Active Loans,Total Members\n";
    const csvRows = currentData
      .map((d) => `"${d.label}",${d.savings},${d.loans},${d.members}`)
      .join("\n");
    const blob = new Blob([headers + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sacco-analytics-${timeframe.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div
      id="analytics-chart-container"
      ref={containerRef}
      className="bg-[#23242a] border border-[#2e303a] rounded-2xl p-4 sm:p-5 shadow-md transition-colors relative"
    >
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#2e303a]/60">
        {/* Metric Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("savings")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeTab === "savings"
                ? "bg-[#1c1d22] text-white border border-[#3e4250] shadow-xs"
                : "text-[#8e95a5] hover:text-white"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Savings</span>
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeTab === "loans"
                ? "bg-[#1c1d22] text-white border border-[#3e4250] shadow-xs"
                : "text-[#8e95a5] hover:text-white"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Loans</span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              activeTab === "members"
                ? "bg-[#1c1d22] text-white border border-[#3e4250] shadow-xs"
                : "text-[#8e95a5] hover:text-white"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Members</span>
          </button>
        </div>

        {/* Right Dropdown Selectors */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {/* Timeframe Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTimeMenu(!showTimeMenu);
                setShowStyleMenu(false);
                setShowMoreMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1c1d22] border border-[#323642] text-white text-xs font-medium hover:border-sky-500/50 transition-colors"
            >
              <span>{timeframe}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#717888]" />
            </button>

            {showTimeMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-[#1c1d22] border border-[#323642] rounded-xl shadow-xl z-30 py-1 text-xs">
                {(["Week", "Month", "Quarter", "Year"] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      setTimeframe(tf);
                      setShowTimeMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#282a32] transition-colors",
                      timeframe === tf ? "text-sky-400 font-semibold" : "text-[#8e95a5]"
                    )}
                  >
                    <span>{tf}</span>
                    {timeframe === tf && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chart Style Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStyleMenu(!showStyleMenu);
                setShowTimeMenu(false);
                setShowMoreMenu(false);
              }}
              className="p-1.5 rounded-lg bg-[#1c1d22] border border-[#323642] text-[#8e95a5] hover:text-white transition-colors"
              title="Change Chart Style"
            >
              {chartStyle === "line" && <LineChartIcon className="w-4 h-4 text-sky-400" />}
              {chartStyle === "area" && <AreaChartIcon className="w-4 h-4 text-purple-400" />}
              {chartStyle === "bar" && <BarChart2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {showStyleMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-[#1c1d22] border border-[#323642] rounded-xl shadow-xl z-30 py-1 text-xs">
                <button
                  onClick={() => { setChartStyle("line"); setShowStyleMenu(false); }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a32] text-[#8e95a5] hover:text-white"
                >
                  <LineChartIcon className="w-3.5 h-3.5 text-sky-400" /> Line Chart
                </button>
                <button
                  onClick={() => { setChartStyle("area"); setShowStyleMenu(false); }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a32] text-[#8e95a5] hover:text-white"
                >
                  <AreaChartIcon className="w-3.5 h-3.5 text-purple-400" /> Area Chart
                </button>
                <button
                  onClick={() => { setChartStyle("bar"); setShowStyleMenu(false); }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a32] text-[#8e95a5] hover:text-white"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> Bar Chart
                </button>
              </div>
            )}
          </div>

          {/* Export / Options */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowTimeMenu(false);
                setShowStyleMenu(false);
              }}
              className="p-1.5 rounded-lg bg-[#1c1d22] border border-[#323642] text-[#8e95a5] hover:text-white transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-[#1c1d22] border border-[#323642] rounded-xl shadow-xl z-30 py-1 text-xs">
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a32] text-[#e2e8f0]"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" /> Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full h-[200px] overflow-hidden">
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${containerWidth} 200`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="loansGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="membersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="40" x2={containerWidth} y2="40" stroke="#2e303a" strokeDasharray="3 3" opacity="0.4" />
          <line x1="0" y1="90" x2={containerWidth} y2="90" stroke="#2e303a" strokeDasharray="3 3" opacity="0.4" />
          <line x1="0" y1="140" x2={containerWidth} y2="140" stroke="#2e303a" strokeDasharray="3 3" opacity="0.4" />

          {/* Chart Types Rendering */}
          {chartStyle === "area" && (
            <path
              d={areaD}
              fill={
                activeTab === "savings"
                  ? "url(#savingsGradient)"
                  : activeTab === "loans"
                  ? "url(#loansGradient)"
                  : "url(#membersGradient)"
              }
            />
          )}

          {chartStyle === "bar" ? (
            points.map((pt, i) => {
              const barWidth = Math.max(16, Math.min(36, containerWidth / points.length - 20));
              const barHeight = Math.max(20, 180 - pt.y);
              return (
                <rect
                  key={i}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={
                    activeTab === "savings"
                      ? "#38bdf8"
                      : activeTab === "loans"
                      ? "#c084fc"
                      : "#34d399"
                  }
                  opacity={hoveredIndex === i ? "1" : "0.85"}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="transition-all duration-200 cursor-pointer"
                />
              );
            })
          ) : (
            <>
              <path
                d={pathD}
                fill="none"
                stroke={
                  activeTab === "savings"
                    ? "#38bdf8"
                    : activeTab === "loans"
                    ? "#c084fc"
                    : "#34d399"
                }
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === i ? "6" : "4"}
                    fill="#1c1d22"
                    stroke={
                      activeTab === "savings"
                        ? "#38bdf8"
                        : activeTab === "loans"
                        ? "#c084fc"
                        : "#34d399"
                    }
                    strokeWidth="3"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              ))}
            </>
          )}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-20 bg-[#1c1d22] border border-[#3e4250] text-white p-2.5 rounded-xl shadow-2xl pointer-events-none text-xs -translate-x-1/2 -translate-y-full"
            style={{
              left: `${points[hoveredIndex].x}px`,
              top: `${points[hoveredIndex].y - 12}px`,
            }}
          >
            <div className="font-bold text-slate-300">{points[hoveredIndex].data.label}</div>
            <div className="text-sky-400 font-semibold mt-0.5 font-mono">
              {formatETB(points[hoveredIndex].data.savings)}
            </div>
            <div className="text-[10px] text-slate-400">
              {points[hoveredIndex].data.loans} active loans · {points[hoveredIndex].data.members} members
            </div>
          </div>
        )}
      </div>

      {/* Bottom X-Axis Labels */}
      <div className="flex items-center justify-between text-xs text-[#717888] pt-2 border-t border-[#2e303a]/40 font-medium">
        {currentData.map((d, i) => (
          <span
            key={i}
            className={cn(
              "cursor-pointer transition-colors",
              hoveredIndex === i ? "text-white font-bold" : "hover:text-slate-300"
            )}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default AnalyticsChart;
