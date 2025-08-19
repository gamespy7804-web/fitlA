'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { realTimeFeedback, type RealTimeFeedbackOutput } from '@/ai/flows/real-time-feedback-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Sparkles, Video, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';

function FeedbackToolContent() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [exercisesForFeedback, setExercisesForFeedback] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Get exercises that require feedback from localStorage
    const storedRoutine = localStorage.getItem('workoutRoutine');
    if (storedRoutine) {
      const parsedRoutine: WorkoutRoutineOutput = JSON.parse(storedRoutine);
      if (parsedRoutine.structuredRoutine) {
        const exercises = parsedRoutine.structuredRoutine
          .flatMap(day => day.exercises)
          .filter(ex => ex.requiresFeedback)
          .map(ex => ex.name);
        
        const uniqueExercises = [...new Set(exercises)];
        setExercisesForFeedback(uniqueExercises);

        const exerciseFromParam = searchParams.get('exercise');
        if (exerciseFromParam && uniqueExercises.includes(exerciseFromParam)) {
            setSelectedExercise(exerciseFromParam);
        } else if (uniqueExercises.length > 0) {
            setSelectedExercise(uniqueExercises[0]);
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acceso a la cámara denegado',
          description: 'Por favor, activa los permisos de la cámara en tu navegador.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  const handleStartRecording = () => {
    if (videoRef.current?.srcObject) {
      setFeedback(null);
      setRecordedChunks([]);
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await handleAnalyze(base64data);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, recordedChunks]);


  const handleAnalyze = async (videoDataUri: string) => {
    if (!selectedExercise) {
        toast({ variant: 'destructive', title: 'Selecciona un ejercicio primero' });
        return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const result: RealTimeFeedbackOutput = await realTimeFeedback({
        videoDataUri,
        exerciseType: selectedExercise,
      });
      setFeedback(result.feedback);
    } catch (error) {
      console.error('Error providing feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Análisis Fallido',
        description: 'No se pudo analizar el video. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Cámara en Vivo</CardTitle>
          <CardDescription>Colócate de manera que todo tu cuerpo sea visible.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative">
            <video ref={videoRef} className="w-full h-full rounded-md" autoPlay muted playsInline />
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                  <Camera className="h-12 w-12 mb-2" />
                  <p className="font-semibold text-center">Permiso de cámara necesario</p>
                </div>
             )}
            {isRecording && <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <div className="mt-4 flex gap-4">
            <Select onValueChange={setSelectedExercise} value={selectedExercise} disabled={exercisesForFeedback.length === 0 || isLoading || isRecording}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ejercicio" />
              </SelectTrigger>
              <SelectContent>
                {exercisesForFeedback.length > 0 ? (
                    exercisesForFeedback.map(ex => (
                        <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))
                ) : (
                    <SelectItem value="none" disabled>No hay ejercicios para analizar</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button onClick={isRecording ? handleStopRecording : handleStartRecording} className="w-40" disabled={isLoading || hasCameraPermission !== true}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Video className="mr-2" />
              )}
              {isRecording ? 'Detener' : 'Grabar'}
            </Button>
          </div>
           {hasCameraPermission === false && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error de Cámara</AlertTitle>
              <AlertDescription>
                No se pudo acceder a la cámara. Por favor, revisa los permisos en tu navegador y asegúrate de que no esté siendo usada por otra aplicación.
              </AlertDescription>
            </Alert>
           )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" />
            Feedback de IA
          </CardTitle>
          <CardDescription>Análisis instantáneo de tu forma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm min-h-48">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analizando tu forma...</span>
            </div>
          )}
          {feedback && (
            <p className="whitespace-pre-wrap">{feedback}</p>
          )}
          {!isLoading && !feedback && (
            <p className="text-muted-foreground">
              {exercisesForFeedback.length > 0 
                ? "Selecciona un ejercicio y graba un video para obtener feedback."
                : "No tienes ejercicios que requieran análisis de forma en tu rutina actual."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function FeedbackTool() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FeedbackToolContent />
    </Suspense>
  );
}
