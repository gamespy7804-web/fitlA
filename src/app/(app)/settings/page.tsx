import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and app preferences.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Alex Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="alex.doe@example.com" />
            </div>
          </div>
           <Button>Save Changes</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Wearable Integration</CardTitle>
          <CardDescription>Sync with your devices to capture more data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-md bg-secondary/50">
            <div>
              <p className="font-medium">Apple Health</p>
              <p className="text-sm text-muted-foreground">Sync workouts and activity.</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-4 rounded-md bg-secondary/50">
            <div>
              <p className="font-medium">Garmin Connect</p>
              <p className="text-sm text-muted-foreground">Sync workouts, steps, and sleep.</p>
            </div>
            <Switch />
          </div>
           <div className="flex items-center justify-between p-4 rounded-md bg-secondary/50">
            <div>
              <p className="font-medium">Strava</p>
              <p className="text-sm text-muted-foreground">Sync your runs and rides.</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
