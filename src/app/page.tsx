'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage is only available on the client
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
    // A small timeout to prevent flash of content, though router.replace should be fast
    const timer = setTimeout(() => setLoading(false), 250); 
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
