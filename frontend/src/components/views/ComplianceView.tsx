'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ComplianceFramework } from '@/types/isms';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import StatusBadge from '@/components/badges/StatusBadge';

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg className="w-20 h-20" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="36" y="36" dominantBaseline="middle" textAnchor="middle" className="text-xs font-bold" style={{ fontSize: '12px', fill: color, fontFamily: 'monospace', fontWeight: 700 }}>{score}%</text>
    </svg>
  );
}

export default function ComplianceView() {
  const { complianceFrameworks, showToast } = useApp();
  const [selected, setSelected] = useState<ComplianceFramework | null>(null);
  const overallScore = Math.round(complianceFrameworks.reduce((a, f) => a + f.score, 0) / complianceFrameworks.length);

  return (
    <div className="space-y-6 pb-8">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Compliance Management</span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Compliance Framework Registry</h1>
        <p className="text-sm text-slate-500 mt-0.5">ISO 27001, SOC 2, GDPR, and HIPAA compliance scorecards and control tracking.</p>
      </div>

      {/* Overall Score Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 px-8 py-7 shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-400/8 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/60 mb-2">Overall Platform Compliance</p>
            <div className="text-5xl font-black text-white font-mono">{overallScore}<span className="text-2xl text-amber-400">%</span></div>
            <p className="text-sm text-slate-400 mt-2">{complianceFrameworks.length} active frameworks · {complianceFrameworks.reduce((a, f) => a + f.passedControls, 0)} controls passed</p>
          </div>
          <div className="flex gap-6 text-center">
            <div><div className="text-2xl font-black text-emerald-400">{complianceFrameworks.reduce((a, f) => a + f.passedControls, 0)}</div><div className="text-xs text-slate-400">Passed</div></div>
            <div><div className="text-2xl font-black text-amber-400">{complianceFrameworks.reduce((a, f) => a + f.pendingControls, 0)}</div><div className="text-xs text-slate-400">Pending</div></div>
            <div><div className="text-2xl font-black text-rose-400">{complianceFrameworks.reduce((a, f) => a + f.failedControls, 0)}</div><div className="text-xs text-slate-400">Failed</div></div>
          </div>
        </div>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {complianceFrameworks.map((fw) => {
          const statusLabel = fw.score >= 90 ? 'compliant' : fw.score >= 75 ? 'pending' : 'non_compliant';
          return (
            <Card key={fw.id} className={`cursor-pointer hover:shadow-md transition-all border-2 ${ selected?.id === fw.id ? 'border-amber-400' : 'border-slate-200 hover:border-amber-200' }`} onClick={() => setSelected(selected?.id === fw.id ? null : fw)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{fw.code}</span>
                      <StatusBadge status={statusLabel} size="sm" />
                    </div>
                    <h3 className="font-bold text-slate-900">{fw.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fw.description}</p>
                    <p className="text-xs text-slate-400 mt-2">Last Audit: {fw.lastAuditDate}</p>
                  </div>
                  <ScoreRing score={fw.score} />
                </div>
                {selected?.id === fw.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-3 text-center mb-4">
                      <div className="p-3 bg-emerald-50 rounded-xl"><div className="text-xl font-black text-emerald-600">{fw.passedControls}</div><div className="text-xs text-emerald-700 font-medium">Passed</div></div>
                      <div className="p-3 bg-amber-50 rounded-xl"><div className="text-xl font-black text-amber-600">{fw.pendingControls}</div><div className="text-xs text-amber-700 font-medium">Pending</div></div>
                      <div className="p-3 bg-rose-50 rounded-xl"><div className="text-xl font-black text-rose-600">{fw.failedControls}</div><div className="text-xs text-rose-700 font-medium">Failed</div></div>
                    </div>
                    {/* Control Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500"><span>Control Progress</span><span>{fw.passedControls}/{fw.totalControls}</span></div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(fw.passedControls / fw.totalControls) * 100}%` }} />
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); showToast('Report Generated', `${fw.code} audit report exported.`, 'success'); }} className="mt-3 w-full py-2 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">
                      Export Audit Report
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
