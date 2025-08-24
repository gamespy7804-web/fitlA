
'use client';

import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
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
import { Camera, Loader2, Sparkles, Video, AlertTriangle, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useI18n } from '@/i18n/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

function FeedbackToolContent() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [exercisesForFeedback, setExercisesForFeedback] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true); // Assume true initially to avoid flash of error
  
  const { toast } = useToast();
  
  const exerciseFromParam = searchParams.get('exercise');

  const loadPendingExercises = useCallback(() => {
    const pending = JSON.parse(localStorage.getItem('pendingFeedbackExercises') || '[]') as string[];
    setExercisesForFeedback(pending);

    if (exerciseFromParam && pending.includes(exerciseFromParam)) {
        setSelectedExercise(exerciseFromParam);
    } else if (pending.length > 0 && !selectedExercise) {
        setSelectedExercise(pending[0]);
    }
  }, [exerciseFromParam, selectedExercise]);


  useEffect(() => {
    loadPendingExercises();
    // Listen for storage changes to update the list in real-time
    window.addEventListener('storage', loadPendingExercises);
    return () => {
      window.removeEventListener('storage', loadPendingExercises)
    }
  }, [loadPendingExercises]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: t('feedbackTool.cameraDenied.title'),
          description: t('feedbackTool.cameraDenied.description'),
        });
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, t]);

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
        toast({ variant: 'destructive', title: t('feedbackTool.selectExerciseError') });
        return;
    }
    setIsLoading(true);
    setFeedback(null);
    try {
      const result: RealTimeFeedbackOutput = await realTimeFeedback({
        videoDataUri,
        exerciseType: selectedExercise,
        language: locale,
      });
      setFeedback(result.feedback);

      // Remove from pending list
      const pending = JSON.parse(localStorage.getItem('pendingFeedbackExercises') || '[]') as string[];
      const updatedPending = pending.filter(ex => ex !== selectedExercise);
      localStorage.setItem('pendingFeedbackExercises', JSON.stringify(updatedPending));
      
      // Manually trigger a storage event to notify other components (like the navbar badge)
      window.dispatchEvent(new Event('storage'));
      
      setExercisesForFeedback(updatedPending);
      if (updatedPending.length > 0) {
        setSelectedExercise(updatedPending[0]);
      } else {
        setSelectedExercise('');
      }

    } catch (error) {
      console.error('Error providing feedback:', error);
      toast({
        variant: 'destructive',
        title: t('feedbackTool.analysisFailed.title'),
        description: t('feedbackTool.analysisFailed.description'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        if (dataUri) {
            handleAnalyze(dataUri);
        }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('feedbackTool.cameraCard.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">
                <Camera className="mr-2 h-4 w-4" />
                {t('feedbackTool.tabs.camera')}
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                {t('feedbackTool.tabs.upload')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="camera" className="mt-4">
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative">
                <video ref={videoRef} className="w-full h-full rounded-md" autoPlay muted playsInline />
                {isRecording && <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-red-500 animate-pulse" />}
              </div>
              {!hasCameraPermission && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('feedbackTool.cameraError.title')}</AlertTitle>
                  <AlertDescription>{t('feedbackTool.cameraError.description')}</AlertDescription>
                </Alert>
              )}
               <div className="mt-4 flex gap-4">
                <Select onValueChange={setSelectedExercise} value={selectedExercise} disabled={exercisesForFeedback.length === 0 || isLoading || isRecording}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('feedbackTool.selectExercisePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {exercisesForFeedback.length > 0 ? (
                        exercisesForFeedback.map(ex => (
                            <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                        ))
                    ) : (
                        <SelectItem value="none" disabled>{t('feedbackTool.noPendingExercises')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={isRecording ? handleStopRecording : handleStartRecording} className="w-40" disabled={isLoading || !hasCameraPermission || !selectedExercise}>
                  {isRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2" />}
                  {isRecording ? t('feedbackTool.buttons.stop') : t('feedbackTool.buttons.record')}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
                <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center relative p-6 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">{t('feedbackTool.upload.description')}</p>
                    <Input ref={fileInputRef} type="file" accept="video/*" className="sr-only" onChange={handleFileChange} />
                </div>
                <div className="mt-4 flex gap-4">
                    <Select onValueChange={setSelectedExercise} value={selectedExercise} disabled={exercisesForFeedback.length === 0 || isLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('feedbackTool.selectExercisePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {exercisesForFeedback.length > 0 ? (
                                exercisesForFeedback.map(ex => (
                                    <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>{t('feedbackTool.noPendingExercises')}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => fileInputRef.current?.click()} className="w-40" disabled={isLoading || !selectedExercise}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2" />}
                        {t('feedbackTool.buttons.upload')}
                    </Button>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" />
            {t('feedbackTool.feedbackCard.title')}
          </CardTitle>
          <CardDescription>{t('feedbackTool.feedbackCard.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm min-h-48">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('feedbackTool.feedbackCard.loading')}</span>
            </div>
          )}
          {feedback && (
            <p className="whitespace-pre-wrap">{feedback}</p>
          )}
          {!isLoading && !feedback && (
            <p className="text-muted-foreground">
              {exercisesForFeedback.length > 0 
                ? t('feedbackTool.feedbackCard.prompt')
                : t('feedbackTool.feedbackCard.allDone')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function FeedbackTool() {
  return (
    <Suspense fallback={<div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <FeedbackToolContent />
    </Suspense>
  );
}

    