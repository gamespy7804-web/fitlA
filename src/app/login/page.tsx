
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
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);
  
  const handleSignIn = async () => {
    setIsSigningIn(true);
    await signInWithGoogle();
    setIsSigningIn(false);
  }

  const isLoading = authLoading || isSigningIn;

  if (authLoading || (!authLoading && user)) {
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
