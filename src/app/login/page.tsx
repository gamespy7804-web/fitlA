
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { useI18n } from '@/i18n/client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoogleIcon } from '@/components/icons';


export default function LoginPage() {
  const { signInWithGoogle, loading: authLoading, user } = useAuth();
  const { t } = useI18n();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If the user is logged in (not anonymous), redirect to dashboard
    if (!authLoading && user && !user.isAnonymous) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);
  
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
        await signInWithGoogle();
    } catch (error) {
        console.error("Sign in failed", error);
    } finally {
        setIsSigningIn(false);
    }
  }

  const isLoading = authLoading || isSigningIn;

  // This page is now primarily for users who want to link their account from settings
  // or if anonymous sign-in somehow fails.
  if (authLoading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <Logo className="h-16 w-16 text-primary" />
            </div>
          <CardTitle className="font-headline text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleSignIn} disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="mr-2 animate-spin" />
            ) : (
                <GoogleIcon className="mr-2" />
            )}
            {t('login.button')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
