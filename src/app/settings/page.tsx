
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Music, Volume2, ShieldAlert, Languages, Loader2, RotateCcw, Save, ShoppingBag } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { toggleMusic, setMusicVolume, setSfxVolume } from '@/hooks/use-audio-effects';
import { useI18n, type Locale } from '@/i18n/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GoogleIcon } from '@/components/icons';
import { useUserData } from '@/hooks/use-user-data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, signOut, signInWithGoogle, loading: authLoading } = useAuth();
  const { t, setLocale, locale } = useI18n();
  const router = useRouter();
  const { diamonds, resetAllData } = useUserData();
  const { toast } = useToast();

  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolumeState] = useState(50);
  const [sfxVolume, setSfxVolumeState] = useState(50);
  const [isResetting, setIsResetting] = useState(false);


  useEffect(() => {
    const storedMusicEnabled = localStorage.getItem('musicEnabled');
    setIsMusicEnabled(storedMusicEnabled === null ? true : storedMusicEnabled === 'true');

    const storedMusicVolume = localStorage.getItem('musicVolume');
    setMusicVolumeState(storedMusicVolume ? parseFloat(storedMusicVolume) * 100 : 50);
    
    const storedSfxVolume = localStorage.getItem('sfxVolume');
    setSfxVolumeState(storedSfxVolume ? parseFloat(storedSfxVolume) * 100 : 50);
  }, []);

  const handleMusicToggle = (enabled: boolean) => {
    setIsMusicEnabled(enabled);
    toggleMusic(enabled);
  };

  const handleMusicVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMusicVolumeState(newVolume);
    setMusicVolume(newVolume / 100);
  };
  
  const handleSfxVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setSfxVolumeState(newVolume);
    setSfxVolume(newVolume / 100);
  };
  
  const handleResetAccount = async () => {
    setIsResetting(true);
    await resetAllData();
    await signOut();
    toast({
        title: t('settings.account.reset.confirm.successTitle'),
        description: t('settings.account.reset.confirm.successDescription'),
    });
    setIsResetting(false);
  }

  const renderUserCard = () => {
    if (authLoading) {
      return (
        <Card>
          <CardHeader>
             <CardTitle className="font-headline">{t('settings.profile.title')}</CardTitle>
             <CardDescription>{t('settings.profile.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-24">
            <Loader2 className="animate-spin" />
          </CardContent>
        </Card>
      )
    }

    if (user) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('settings.profile.title')}</CardTitle>
            <CardDescription>{t('settings.profile.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.profile.name')}</Label>
                <Input id="name" defaultValue={user?.displayName ?? ''} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.profile.email')}</Label>
                <Input id="email" type="email" defaultValue={user?.email ?? ''} readOnly disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
          <CardHeader>
            <CardTitle className="font-headline">Guardar Progreso</CardTitle>
            <CardDescription>Inicia sesión para sincronizar tu progreso y no perder tus datos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={signInWithGoogle}>
              <GoogleIcon className="mr-2" />
              Iniciar Sesión con Google
            </Button>
          </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('settings.description')}
        </p>
      </div>

      {renderUserCard()}

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">{t('settings.credits.title')}</CardTitle>
            <CardDescription>{t('settings.credits.description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-between rounded-lg border p-4'>
            <div className='flex items-center gap-2'>
                 <span role="img" aria-label="diamond" className='text-2xl'>💎</span>
                 <div>
                    <p className="font-medium">{t('settings.credits.yourBalance')}</p>
                    <p className="text-2xl font-bold">{diamonds ?? 0}</p>
                 </div>
            </div>
            <Button onClick={() => router.push('/store')}>
                <ShoppingBag className="mr-2" />
                {t('settings.credits.buyMore')}
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('settings.sound.title')}</CardTitle>
          <CardDescription>{t('settings.sound.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <Music className="h-5 w-5 text-primary" />
                <Label htmlFor="music-switch" className="font-medium">
                  {t('settings.sound.backgroundMusic')}
                </Label>
              </div>
              <Switch
                id="music-switch"
                checked={isMusicEnabled}
                onCheckedChange={handleMusicToggle}
                aria-label={t('settings.sound.toggleMusic')}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4 rounded-lg border p-4">
               <div className="space-y-3">
                 <div className="flex items-center space-x-3">
                   <Volume2 className="h-5 w-5 text-primary" />
                   <Label htmlFor="music-volume" className="font-medium">
                     {t('settings.sound.musicVolume')}
                   </Label>
                 </div>
                 <Slider
                   id="music-volume"
                   defaultValue={[musicVolume]}
                   max={100}
                   step={1}
                   onValueChange={handleMusicVolumeChange}
                   disabled={!isMusicEnabled}
                 />
              </div>
               <div className="space-y-3">
                 <div className="flex items-center space-x-3">
                   <Volume2 className="h-5 w-5 text-primary" />
                   <Label htmlFor="sfx-volume" className="font-medium">
                     {t('settings.sound.sfxVolume')}
                   </Label>
                 </div>
                 <Slider
                   id="sfx-volume"
                   defaultValue={[sfxVolume]}
                   max={100}
                   step={1}
                   onValueChange={handleSfxVolumeChange}
                 />
              </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
            <CardTitle className="font-headline">{t('settings.language.title')}</CardTitle>
            <CardDescription>{t('settings.language.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex items-center gap-2 rounded-lg border p-4'>
              <Languages className="h-5 w-5 text-primary" />
              <Label className="font-medium mr-auto">{t('settings.language.select')}</Label>
              <div className="flex items-center gap-2">
                  <Button variant={locale === 'es' ? 'default' : 'outline'} onClick={() => setLocale('es')}>Español</Button>
                  <Button variant={locale === 'en' ? 'default' : 'outline'} onClick={() => setLocale('en')}>English</Button>
              </div>
          </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('settings.account.title')}</CardTitle>
          <CardDescription>{t('settings.account.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {user && (
              <div className='flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-border p-4'>
                <div>
                    <h3 className="font-medium">{t('settings.account.signOut.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('settings.account.signOut.description')}</p>
                </div>
                <Button variant="outline" onClick={signOut} className="mt-2 md:mt-0 md:ml-4">
                    <LogOut className="mr-2" />
                    {t('settings.account.signOut.button')}
                </Button>
              </div>
            )}
            <div className='flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-destructive/50 p-4'>
             <div>
                <h3 className="font-medium text-destructive">{t('settings.account.reset.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.account.reset.description')}</p>
             </div>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-2 md:mt-0 md:ml-4">
                  <RotateCcw className="mr-2" />
                  {t('settings.account.reset.button')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.account.reset.confirm.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.account.reset.confirm.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isResetting}>{t('settings.account.reset.confirm.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAccount} disabled={isResetting}>
                    {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('settings.account.reset.confirm.action')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
