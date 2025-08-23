
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
  const router = useRouter();

  useEffect(() => {
    // This page should ideally not be visited if a user (even anonymous) exists.
    // Redirect to dashboard if the user is already here.
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);
  

  if (authLoading || user) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // This page will now only render if anonymous sign-in fails and there's no user.
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
          <Button className="w-full" onClick={signInWithGoogle} disabled={authLoading}>
            {authLoading ? (
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
