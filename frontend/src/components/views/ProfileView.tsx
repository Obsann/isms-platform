'use client';

import React, { useState } from 'react';
import { User, Shield, Phone, Mail, MapPin, Building2, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import FormFieldGroup from '@/components/forms/FormFieldGroup';

export default function ProfileView() {
  const { userProfile, updateProfile, showToast } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...userProfile });

  const initials = userProfile.name.split(' ').map((n) => n[0]).slice(0, 2).join('');

  const handleSave = () => {
    updateProfile(form);
    showToast('Profile Updated', 'Your profile information has been saved.', 'success');
    setEditMode(false);
  };

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Account</span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 font-serif">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account information and security settings.</p>
      </div>

      {/* Avatar Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-0 text-white">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center text-2xl font-black shrink-0 shadow-lg">{initials}</div>
          <div>
            <h2 className="text-xl font-bold text-white">{userProfile.name}</h2>
            <p className="text-amber-400 font-semibold text-sm">{userProfile.title}</p>
            <p className="text-slate-400 text-xs mt-1">{userProfile.department}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${ userProfile.mfaEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400' }`}>
                <Shield className="w-3 h-3" /> MFA {userProfile.mfaEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
                {userProfile.clearance}
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <button onClick={() => { setForm({ ...userProfile }); setEditMode(!editMode); }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${ editMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' }`}>
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" />Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldGroup label="Full Name"><input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></FormFieldGroup>
                <FormFieldGroup label="Job Title"><input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></FormFieldGroup>
                <FormFieldGroup label="Email"><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></FormFieldGroup>
                <FormFieldGroup label="Phone"><input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></FormFieldGroup>
                <FormFieldGroup label="Department"><input type="text" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></FormFieldGroup>
                <FormFieldGroup label="Location"><input type="text" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></FormFieldGroup>
              </div>
              <button onClick={handleSave} className="w-full py-2.5 bg-slate-900 text-amber-400 text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">Save Changes</button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: User, label: 'Full Name', value: userProfile.name },
                { icon: Building2, label: 'Department', value: userProfile.department },
                { icon: Mail, label: 'Email', value: userProfile.email },
                { icon: Phone, label: 'Phone', value: userProfile.phone },
                { icon: MapPin, label: 'Location', value: userProfile.location },
                { icon: Shield, label: 'Clearance', value: userProfile.clearance },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-4 h-4" />Security Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">Multi-Factor Authentication</p>
              <p className="text-xs text-slate-500 mt-0.5">FIDO2 Security Key (Hardware MFA)</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${ userProfile.mfaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700' }`}>
              {userProfile.mfaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">Security Clearance Level</p>
              <p className="text-xs text-slate-500 mt-0.5">Access authorization level for classified data</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{userProfile.clearance}</span>
          </div>
          <button onClick={() => showToast('Password Reset', 'Password reset link sent to your email.', 'info')} className="w-full py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Change Password</button>
        </CardContent>
      </Card>
    </div>
  );
}
