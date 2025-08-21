
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Music } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { playMusic, stopMusic } from '@/hooks/use-sound';


export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);

  useEffect(() => {
    const storedPreference = localStorage.getItem('musicEnabled') === 'true';
    setIsMusicEnabled(storedPreference);
  }, []);

  const handleMusicToggle = (enabled: boolean) => {
    setIsMusicEnabled(enabled);
    localStorage.setItem('musicEnabled', JSON.stringify(enabled));
    if (enabled) {
      playMusic();
    } else {
      stopMusic();
    }
    // Dispatch a storage event to notify other parts of the app, like the layout
    window.dispatchEvent(new Event('storage'));
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
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cuenta</CardTitle>
          <CardDescription>Gestiona las acciones de tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button variant="destructive" onClick={signOut}>
                <LogOut className="mr-2" />
                Cerrar sesión
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}
