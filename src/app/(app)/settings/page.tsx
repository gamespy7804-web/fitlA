
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Music, Volume2, ShieldAlert } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { toggleMusic, setMusicVolume } from '@/hooks/use-audio-effects';


export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(50);


  useEffect(() => {
    const storedPreference = localStorage.getItem('musicEnabled') === 'true';
    setIsMusicEnabled(storedPreference);

    const storedVolume = localStorage.getItem('musicVolume');
    if (storedVolume) {
      setMusicVolumeState(parseFloat(storedVolume) * 100);
    } else {
      setMusicVolumeState(50); // Default volume
    }
  }, []);

  const handleMusicToggle = (enabled: boolean) => {
    setIsMusicEnabled(enabled);
    toggleMusic(enabled);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMusicVolumeState(newVolume);
    setMusicVolume(newVolume / 100);
  };


  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y las preferencias de la aplicación.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Perfil</CardTitle>
          <CardDescription>Actualiza tu información personal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" defaultValue={user?.displayName ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" defaultValue={user?.email ?? ''} readOnly disabled />
            </div>
          </div>
           <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Sonido</CardTitle>
          <CardDescription>Gestiona las preferencias de sonido de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-3">
                <Music className="h-5 w-5 text-primary" />
                <Label htmlFor="music-switch" className="font-medium">
                  Música de Fondo
                </Label>
              </div>
              <Switch
                id="music-switch"
                checked={isMusicEnabled}
                onCheckedChange={handleMusicToggle}
                aria-label="Activar o desactivar la música de fondo"
              />
            </div>
            <div className="space-y-3 rounded-lg border p-4">
               <div className="flex items-center space-x-3">
                 <Volume2 className="h-5 w-5 text-primary" />
                 <Label htmlFor="music-volume" className="font-medium">
                   Volumen de la Música
                 </Label>
               </div>
               <Slider
                 id="music-volume"
                 defaultValue={[musicVolume]}
                 max={100}
                 step={1}
                 onValueChange={handleVolumeChange}
                 disabled={!isMusicEnabled}
               />
            </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cuenta</CardTitle>
          <CardDescription>Gestiona las acciones de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className='flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-border p-4'>
             <div>
                <h3 className="font-medium">Cerrar Sesión</h3>
                <p className="text-sm text-muted-foreground">Finaliza tu sesión actual en este dispositivo.</p>
             </div>
             <Button variant="outline" onClick={signOut} className="mt-2 md:mt-0 md:ml-4">
                <LogOut className="mr-2" />
                Cerrar sesión
             </Button>
           </div>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-destructive/50 p-4'>
             <div>
                <h3 className="font-medium text-destructive">Eliminar Cuenta</h3>
                <p className="text-sm text-muted-foreground">Esta acción es permanente y no se puede deshacer.</p>
             </div>
             <Button variant="destructive" className="mt-2 md:mt-0 md:ml-4">
                <ShieldAlert className="mr-2" />
                Eliminar mi cuenta
             </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
