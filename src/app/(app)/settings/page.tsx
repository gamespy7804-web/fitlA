
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Music } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const musicTracks = [
  { id: 'none', name: 'Sin Música' },
  { id: 'music-1', name: 'Aventura Épica' },
  { id: 'music-2', name: 'Electrónica Focus' },
  { id: 'music-3', name: 'Ambiente Relajante' },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('none');
  const [musicVolume, setMusicVolume] = useState([50]);

  useEffect(() => {
    // Cargar preferencias de música desde localStorage
    const savedSettings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
    setIsMusicEnabled(savedSettings.enabled ?? false);
    setSelectedTrack(savedSettings.track ?? 'none');
    setMusicVolume([savedSettings.volume ?? 50]);
  }, []);

  const handleMusicSettingsChange = (change: { enabled?: boolean; track?: string; volume?: number[] }) => {
    const currentSettings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
    const newSettings = { ...currentSettings, ...change };

    if (change.enabled !== undefined) setIsMusicEnabled(change.enabled);
    if (change.track !== undefined) setSelectedTrack(change.track);
    if (change.volume !== undefined) setMusicVolume(change.volume);

    localStorage.setItem('musicSettings', JSON.stringify(newSettings));
    // Disparar un evento para que el reproductor de música reaccione
    window.dispatchEvent(new Event('music-settings-changed'));
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
          <CardTitle className="font-headline flex items-center gap-2"><Music />Música de Fondo</CardTitle>
          <CardDescription>Elige una banda sonora para motivarte durante tus entrenamientos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="music-enabled" className="text-base">Activar música</Label>
            <Switch
              id="music-enabled"
              checked={isMusicEnabled}
              onCheckedChange={(checked) => handleMusicSettingsChange({ enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="music-track">Pista de Música</Label>
            <Select
              value={selectedTrack}
              onValueChange={(value) => handleMusicSettingsChange({ track: value })}
              disabled={!isMusicEnabled}
            >
              <SelectTrigger id="music-track">
                <SelectValue placeholder="Selecciona una pista" />
              </SelectTrigger>
              <SelectContent>
                {musicTracks.map(track => (
                  <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="music-volume">Volumen</Label>
             <Slider
                id="music-volume"
                value={musicVolume}
                onValueChange={(value) => setMusicVolume(value)}
                onPointerUpCapture={() => handleMusicSettingsChange({ volume: musicVolume })}
                max={100}
                step={1}
                disabled={!isMusicEnabled}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Integración con Wearables</CardTitle>
          <CardDescription>Sincroniza con tus dispositivos para capturar más datos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-md bg-secondary/50">
            <div>
              <p className="font-medium">Apple Health</p>
              <p className="text-sm text-muted-foreground">Sincronizar entrenamientos y actividad.</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-4 rounded-md bg-secondary/50">
            <div>
              <p className="font-medium">Garmin Connect</p>
              <p className="text-sm text-muted-foreground">Sincronizar entrenamientos, pasos y sueño.</p>
            </div>
            <Switch />
          </div>
           <div className="flex items-center justify-between p-4 rounded-md bg-secondary/50">
            <div>
              <p className="font-medium">Strava</p>
              <p className="text-sm text-muted-foreground">Sincroniza tus carreras y paseos en bicicleta.</p>
            </div>
            <Switch />
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
