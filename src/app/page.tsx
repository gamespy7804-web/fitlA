
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useUserData } from '@/hooks/use-user-data';

export default function Home() {
  const { loading: authLoading } = useAuth();
  const { onboardingComplete, loading: userDataLoading } = useUserData();
  const router = useRouter();

  useEffect(() => {
    const isLoading = authLoading || userDataLoading;
    if (isLoading) {
      return; // Wait until all auth and user data state is confirmed
    }

    if (onboardingComplete) {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
  }, [onboardingComplete, authLoading, userDataLoading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
