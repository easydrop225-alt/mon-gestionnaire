'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isSuperAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    router.replace(isSuperAdmin ? '/platform-admin' : '/dashboard');
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  return null;
}
