
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Music, Volume2, ShieldAlert, Languages, Loader2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { user, signOut, deleteAccount } = useAuth();
  const { t, setLocale, locale } = useI18n();

  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolumeState] = useState(50);
  const [sfxVolume, setSfxVolumeState] = useState(50);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    const storedPreference = localStorage.getItem('musicEnabled');
    if (storedPreference !== null) {
      setIsMusicEnabled(storedPreference === 'true');
    }

    const storedMusicVolume = localStorage.getItem('musicVolume');
    if (storedMusicVolume) {
      setMusicVolumeState(parseFloat(storedMusicVolume) * 100);
    } else {
      setMusicVolumeState(50); // Default volume
    }
    
    const storedSfxVolume = localStorage.getItem('sfxVolume');
    if (storedSfxVolume) {
        setSfxVolumeState(parseFloat(storedSfxVolume) * 100);
    } else {
        setSfxVolumeState(50); // Default volume
    }
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
  
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    await deleteAccount();
    // The deleteAccount function will handle redirection on success/failure.
    // We can set isDeleting to false in case of failure, which will be handled in the hook.
    setIsDeleting(false);
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
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('settings.profile.title')}</CardTitle>
          <CardDescription>{t('settings.profile.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.profile.name')}</Label>
              <Input id="name" defaultValue={user?.displayName ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.profile.email')}</Label>
              <Input id="email" type="email" defaultValue={user?.email ?? ''} readOnly disabled />
            </div>
          </div>
           <Button>{t('settings.profile.save')}</Button>
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
            <div className='flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-destructive/50 p-4'>
             <div>
                <h3 className="font-medium text-destructive">{t('settings.account.delete.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('settings.account.delete.description')}</p>
             </div>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-2 md:mt-0 md:ml-4">
                  <ShieldAlert className="mr-2" />
                  {t('settings.account.delete.button')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.account.delete.confirm.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.account.delete.confirm.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>{t('settings.account.delete.confirm.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('settings.account.delete.confirm.action')}
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
