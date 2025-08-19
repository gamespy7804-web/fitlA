import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Juegos
        </h1>
        <p className="text-muted-foreground">
          ¡Próximamente! Desafía tus límites con juegos interactivos.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Gamepad2 className="text-primary"/>
                Zona de Juegos
            </CardTitle>
            <CardDescription>
                Esta sección está en construcción.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Estamos trabajando en juegos y desafíos para hacer tu entrenamiento más divertido y competitivo. ¡Vuelve pronto!
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
