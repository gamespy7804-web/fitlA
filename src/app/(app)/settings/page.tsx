
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Music } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const musicTracks = [
  { id: 'music-1', name: 'Aventura Épica' },
  { id: 'music-2', name: 'Electrónica Focus' },
  { id: 'music-3', name: 'Ambiente Relajante' },
]

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicTrack, setMusicTrack] = useState('none');
  const [musicVolume, setMusicVolume] = useState(50);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
    setMusicEnabled(settings.enabled || false);
    setMusicTrack(settings.track || 'none');
    setMusicVolume(settings.volume || 50);
  }, []);

  const handleMusicSettingsChange = (key: string, value: any) => {
     const newSettings = {
        enabled: musicEnabled,
        track: musicTrack,
        volume: musicVolume,
        [key]: value,
     };
     localStorage.setItem('musicSettings', JSON.stringify(newSettings));
     window.dispatchEvent(new Event('music-settings-changed'));
  }

  const handleEnabledChange = (enabled: boolean) => {
    setMusicEnabled(enabled);
    handleMusicSettingsChange('enabled', enabled);
  }

  const handleTrackChange = (track: string) => {
    setMusicTrack(track);
    handleMusicSettingsChange('track', track);
  }
  
  const handleVolumeChange = (volume: number[]) => {
    setMusicVolume(volume[0]);
    handleMusicSettingsChange('volume', volume[0]);
  }


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
          <CardTitle className="font-headline flex items-center gap-2"><Music/>Música de Fondo</CardTitle>
          <CardDescription>Elige una banda sonora para motivarte durante tus entrenamientos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="music-enabled">Activar Música</Label>
                <Switch id="music-enabled" checked={musicEnabled} onCheckedChange={handleEnabledChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="music-track">Pista de Música</Label>
                 <Select value={musicTrack} onValueChange={handleTrackChange} disabled={!musicEnabled}>
                    <SelectTrigger id="music-track">
                        <SelectValue placeholder="Seleccionar Pista" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {musicTracks.map(track => (
                            <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="music-volume">Volumen</Label>
                <Slider id="music-volume" value={[musicVolume]} onValueChange={handleVolumeChange} max={100} step={1} disabled={!musicEnabled}/>
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
