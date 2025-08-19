import { ProgressChart } from '@/components/client/progress-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const logData = [
  { date: '2024-07-22', workout: 'Fuerza del Tren Superior', duration: '55 min', volume: '5,400 kg' },
  { date: '2024-07-20', workout: 'Potencia del Tren Inferior', duration: '65 min', volume: '8,200 kg' },
  { date: '2024-07-18', workout: 'Acondicionamiento de Cuerpo Completo', duration: '45 min', volume: 'N/A' },
  { date: '2024-07-15', workout: 'Fuerza del Tren Superior', duration: '50 min', volume: '5,150 kg' },
  { date: '2024-06-25', workout: 'Fuerza del Tren Superior', duration: '50 min', volume: '4,900 kg' },
  { date: '2024-06-22', workout: 'Potencia del Tren Inferior', duration: '60 min', volume: '7,800 kg' },
  { date: '2024-05-15', workout: 'Acondicionamiento de Cuerpo Completo', duration: '45 min', volume: 'N/A' },
  { date: '2024-05-10', workout: 'Fuerza del Tren Superior', duration: '52 min', volume: '4,500 kg' },
];

export default function LogPage() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Registro de Entrenamiento
          </h1>
          <p className="text-muted-foreground">
            Revisa tus entrenamientos pasados y sigue tu progreso a largo plazo.
          </p>
        </div>
        <Button variant="secondary">
          <Share2 className="mr-2" />
          Compartir Mi Progreso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Historial de Entrenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Entrenamiento</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Volumen Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logData.map((log) => (
                <TableRow key={log.date}>
                  <TableCell className="font-medium">
                    {format(new Date(log.date), "d 'de' MMMM, yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>{log.workout}</TableCell>
                  <TableCell>{log.duration}</TableCell>
                  <TableCell>{log.volume}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <ProgressChart />
    </div>
  );
}
