'use client';

import type { ReactNode } from 'react';
import { useLinkedMember, type LinkedMemberState } from './useLinkedMember';
import type { Member } from '@/types';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{children}</div>
    </div>
  );
}

export function LinkedMemberGate({
  children,
}: {
  children: (member: Member) => ReactNode;
}) {
  const state: LinkedMemberState = useLinkedMember();

  if (state.status === 'loading' || state.status === 'unauthenticated') {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400" role="status">
        Loading your member record…
      </p>
    );
  }

  if (state.status === 'error') {
    return <Panel title="Could not load member">{state.message}</Panel>;
  }

  if (state.status === 'missing') {
    return (
      <Panel title="No member record for this login">
        Signed in as {state.email}, but no member in this SACCO uses that email. Ask a teller to
        register you, or sign in with a seeded member account.
      </Panel>
    );
  }

  return <>{children(state.member)}</>;
}
