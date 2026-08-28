'use client';

import { useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import { findMemberForSession } from '@/lib/api-client/member-self-service';
import { useAuthUser } from '@/components/auth/useAuthUser';
import type { Member } from '@/types';

export type LinkedMemberState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'missing'; email: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; member: Member };

export function useLinkedMember(): LinkedMemberState {
  const user = useAuthUser();
  const [state, setState] = useState<LinkedMemberState>(() =>
    user ? { status: 'loading' } : { status: 'unauthenticated' },
  );

  useEffect(() => {
    if (!user) {
      setState({ status: 'unauthenticated' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    findMemberForSession()
      .then((member) => {
        if (cancelled) return;
        if (!member) {
          setState({ status: 'missing', email: user.email });
          return;
        }
        setState({ status: 'ready', member });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: err instanceof ApiRequestError ? err.message : 'Could not load your member record.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
}
