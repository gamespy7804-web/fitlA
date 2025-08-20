
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { FeedbackTool } from "./feedback-tool";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Feedback en Tiempo Real
        </h1>
        <p className="text-muted-foreground">
          Usa tu cámara para obtener feedback de tu técnica de ejercicio con IA.
        </p>
      </div>
      <Suspense fallback={<div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <FeedbackTool />
      </Suspense>
    </div>
  );
}
