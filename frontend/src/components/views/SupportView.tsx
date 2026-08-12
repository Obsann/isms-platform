'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import FormFieldGroup from '@/components/forms/FormFieldGroup';

const faqs = [
  { q: 'What is ISMS?', a: 'ISMS (Information Security Management System) is a systematic approach to managing sensitive company information so it remains secure. It encompasses people, processes, and IT systems by applying a risk management process.' },
  { q: 'How is the vendor compliance score calculated?', a: 'Vendor audit scores are calculated based on ISO 27001 control assessments, penetration test results, and policy reviews. Scores below 60 trigger High Risk status, 60-74 is Non-Compliant, 75-84 is Pending, and 85+ is Compliant.' },
  { q: 'What is Fayda ID verification?', a: "Fayda is Ethiopia's national digital identity system. All Sacco member registrations require Fayda ID verification to ensure member authenticity and prevent fraudulent accounts." },
  { q: 'How are audit logs protected?', a: 'Audit logs are immutable and cryptographically signed. Every system event, user action, and data modification is recorded with timestamp, IP address, and user identity. Logs cannot be deleted or modified.' },
  { q: 'What does the Quick Scan feature do?', a: 'Quick Scan triggers an automated security assessment across core infrastructure and vendor APIs. It checks for open vulnerabilities, expired certificates, MFA enforcement gaps, and policy violations.' },
];

export default function SupportView() {
  const { showToast } = useApp();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'Technical Issue', priority: 'Medium', description: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) { showToast('Validation Error', 'Subject and description are required.', 'error'); return; }
    setSubmitted(true);
    showToast('Ticket Submitted', `Support ticket "${ticketForm.subject}" has been submitted.`, 'success');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Help & Support</span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Support Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">ISMS platform documentation, FAQ, and ticket submission.</p>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="w-4 h-4" />Frequently Asked Questions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-800 text-sm">{faq.q}</span>
                {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {expandedFaq === i && (
                <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">{faq.a}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Ticket Form */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />Submit a Support Ticket</CardTitle></CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl mb-4">✓</div>
              <h3 className="font-bold text-slate-900 text-lg">Ticket Submitted!</h3>
              <p className="text-slate-500 text-sm mt-1">Our support team will respond within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormFieldGroup label="Subject" required>
                <input type="text" value={ticketForm.subject} onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Brief description of your issue" />
              </FormFieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldGroup label="Category">
                  <select value={ticketForm.category} onChange={(e) => setTicketForm((p) => ({ ...p, category: e.target.value }))}>
                    {['Technical Issue','Compliance Query','Feature Request','Account Access','Data Privacy'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormFieldGroup>
                <FormFieldGroup label="Priority">
                  <select value={ticketForm.priority} onChange={(e) => setTicketForm((p) => ({ ...p, priority: e.target.value }))}>
                    {['Low','Medium','High','Critical'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormFieldGroup>
              </div>
              <FormFieldGroup label="Description" required>
                <textarea value={ticketForm.description} onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))} placeholder="Provide detailed information about your issue..." rows={4} />
              </FormFieldGroup>
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-amber-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">Submit Ticket</button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" />Quick Links</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[['ISO 27001 Standard Guide','📋'],['ISMS Platform API Docs','📡'],['Fayda Integration Docs','🪪'],['Compliance Checklist Template','✅'],['Risk Assessment Framework','⚠️'],['Security Incident Response','🚨']].map(([label, icon]) => (
            <button key={label} onClick={() => showToast('Opening Resource', `Loading: ${label}`, 'info')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all text-left">
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
