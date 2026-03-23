'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { AuthDialog } from './auth-dialog';
import { useState } from 'react';

export function UserMenu() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium hidden sm:inline-block text-gray-600">Привет, {session.user?.name || 'гость'}</span>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>Выйти</Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setAuthOpen(true)}>Войти</Button>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
