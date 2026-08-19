'use client';

import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import StatusBadge from '@/components/badges/StatusBadge';
import { ShieldCheck, BadgeCheck, TrendingUp, DollarSign, CreditCard, Building2 } from 'lucide-react';

export default function MemberDashboardPage() {
  const { members, notifications, showToast } = useApp();
  const myMember = members[0]; // First member as the logged-in member
  if (!myMember) return <div className="p-8 text-center text-slate-500">No member data found.</div>;

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 px-8 py-8 shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/60 mb-2">Welcome back</p>
            <h1 className="text-2xl font-black text-white">{myMember.fullName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={myMember.status} size="sm" />
              {myMember.verifiedByFayda && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <BadgeCheck className="w-3.5 h-3.5" /> Fayda Verified
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Member ID</p>
            <p className="font-mono font-bold text-amber-400 text-lg">{myMember.id}</p>
            <p className="text-xs text-slate-400 mt-1">{myMember.membershipType} Member · {myMember.branch}</p>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Savings Balance</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <CurrencyDisplay value={myMember.savingsBalance} currency="ETB" size="lg" variant="gold" />
            <p className="text-xs text-slate-500 mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Share Capital</span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <CurrencyDisplay value={myMember.shareCapital} currency="ETB" size="lg" />
            <p className="text-xs text-slate-500 mt-1">Ownership equity stake</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loan Balance</span>
              <Building2 className="w-4 h-4 text-purple-500" />
            </div>
            <CurrencyDisplay value={myMember.loanBalance} currency="ETB" size="lg" />
            <p className="text-xs text-slate-500 mt-1">{myMember.loanBalance > 0 ? 'Outstanding loan repayment' : 'No active loans'}</p>
          </CardContent>
        </Card>
      </div>

      {/* My Info & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" />My Account Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Full Name', value: myMember.fullName },
                { label: 'Fayda ID', value: myMember.faydaId },
                { label: 'Email', value: myMember.email },
                { label: 'Phone', value: myMember.phone },
                { label: 'Branch', value: myMember.branch },
                { label: 'Joined', value: myMember.joinedDate },
                { label: 'Occupation', value: myMember.occupation },
                { label: 'Membership', value: myMember.membershipType },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">No notifications</p>
              ) : notifications.map((n) => (
                <div key={n.id} className={`p-3 rounded-xl border transition-colors ${ !n.read ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200' }`}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-xs font-bold ${ !n.read ? 'text-slate-900' : 'text-slate-700' }`}>{n.title}</p>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['💰 Deposit', 'Add funds to savings'], ['🏧 Withdraw', 'Request withdrawal'], ['📋 Statement', 'Download account statement'], ['📞 Contact Teller', 'Get assistance']].map(([label, desc]) => (
              <button key={String(label)} onClick={() => showToast('Coming Soon', `${label} feature coming soon.`, 'info')} className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all text-left">
                <p className="font-bold text-slate-800 text-sm">{String(label)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{String(desc)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
