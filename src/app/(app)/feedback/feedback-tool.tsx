
'use client';

import { useEffect, useState, useRef, Suspense, useCallback, DragEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Camera, Loader2, Sparkles, Video, AlertTriangle, Upload, Ticket, CheckCircle, Info, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useI18n } from '@/i18n/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function FeedbackToolContent() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const { pendingFeedback, feedbackCredits, removePendingFeedback, consumeFeedbackCredit } = useUserData();

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<RealTimeFeedbackOutput | null>(null);
  const [exercisesForFeedback, setExercisesForFeedback] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [customExercise, setCustomExercise] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true); // Assume true initially to avoid flash of error
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [videoToAnalyze, setVideoToAnalyze] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { toast } = useToast();
  
  const exerciseFromParam = searchParams.get('exercise');

  useEffect(() => {
    setExercisesForFeedback(pendingFeedback ?? []);

    if (exerciseFromParam && (pendingFeedback ?? []).includes(exerciseFromParam)) {
        setSelectedExercise(exerciseFromParam);
    } else if ((pendingFeedback ?? []).length > 0 && !selectedExercise) {
        setSelectedExercise(pendingFeedback![0]);
    }
  }, [pendingFeedback, exerciseFromParam, selectedExercise]);


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
    const analyzeRecordedVideo = async () => {
      if (!isRecording && recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          setVideoToAnalyze(base64data);
        };
      }
    };
    analyzeRecordedVideo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, recordedChunks]);


  const handleAnalyze = async () => {
    const exerciseToAnalyze = customExercise.trim() || selectedExercise;
    if (!exerciseToAnalyze) {
        toast({ variant: 'destructive', title: t('feedbackTool.selectExerciseError') });
        return;
    }
    
    if (!videoToAnalyze) {
        toast({ variant: 'destructive', title: t('feedbackTool.noVideoError')});
        return;
    }

    if ((feedbackCredits ?? 0) <= 0) {
        toast({ variant: 'destructive', title: t('feedbackTool.noCredits.title'), description: t('feedbackTool.noCredits.description') });
        return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      consumeFeedbackCredit(); // Consume credit optimistically
      const result: RealTimeFeedbackOutput = await realTimeFeedback({
        videoDataUri: videoToAnalyze,
        exerciseType: exerciseToAnalyze,
        language: locale,
      });
      setFeedback(result);

      if (pendingFeedback?.includes(exerciseToAnalyze)) {
        removePendingFeedback(exerciseToAnalyze);
        
        if ((pendingFeedback?.length ?? 1) - 1 > 0) {
          setSelectedExercise(pendingFeedback![0]);
        } else {
          setSelectedExercise('');
        }
      }
      setCustomExercise('');
      setUploadedVideoUrl(null);
      setVideoToAnalyze(null);
      setRecordedChunks([]);


    } catch (error) {
      console.error('Error providing feedback:', error);
      toast({
        variant: 'destructive',
        title: t('feedbackTool.analysisFailed.title'),
        description: t('feedbackTool.analysisFailed.description'),
      });
      // TODO: Here you could add logic to refund the credit if the API call failed.
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
        toast({ variant: 'destructive', title: t('feedbackTool.upload.invalidFileType') });
        return;
    }

    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    const newUrl = URL.createObjectURL(file);
    setUploadedVideoUrl(newUrl);

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        if (dataUri) {
            setVideoToAnalyze(dataUri);
        }
    };
    reader.readAsDataURL(file);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
    }
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragging(true);
    } else if (e.type === 'dragleave') {
        setIsDragging(false);
    }
  };

  const handleTabChange = () => {
    setUploadedVideoUrl(null);
    setVideoToAnalyze(null);
    setRecordedChunks([]);
    setFeedback(null);
  }
  
  const noCredits = (feedbackCredits ?? 0) <= 0;
  const isAnalyzeButtonDisabled = isLoading || noCredits || (!customExercise.trim() && !selectedExercise);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline">{t('feedbackTool.cameraCard.title')}</CardTitle>
              <CardDescription>{t('feedbackTool.cameraCard.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-3 py-1.5 rounded-md text-sm border">
                <span role="img" aria-label="diamond">💎</span>
                <span>{feedbackCredits ?? 0}</span>
                <span className="hidden sm:inline">{t('feedbackTool.credits')}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-4 p-4 border rounded-lg">
                <Label className="font-semibold text-base">{t('feedbackTool.step1')}</Label>
                 <Select onValueChange={setSelectedExercise} value={selectedExercise} disabled={isLoading || isRecording}>
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
                <div>
                  <Label htmlFor="custom-exercise">{t('feedbackTool.customExerciseLabel')}</Label>
                  <Input 
                    id="custom-exercise"
                    placeholder={t('feedbackTool.customExercisePlaceholder')}
                    value={customExercise}
                    onChange={(e) => setCustomExercise(e.target.value)}
                    disabled={isLoading || isRecording}
                  />
                </div>
            </div>
            <div className="space-y-4 p-4 border rounded-lg">
              <Label className="font-semibold text-base">{t('feedbackTool.step2')}</Label>
              <Tabs defaultValue="camera" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="camera" disabled={isLoading || noCredits}>
                    <Camera className="mr-2 h-4 w-4" />
                    {t('feedbackTool.tabs.camera')}
                  </TabsTrigger>
                  <TabsTrigger value="upload" disabled={isLoading || noCredits}>
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
                    <Button onClick={isRecording ? handleStopRecording : handleStartRecording} className="w-full" disabled={isLoading || noCredits || !hasCameraPermission}>
                      {isRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2" />}
                      {isRecording ? t('feedbackTool.buttons.stop') : t('feedbackTool.buttons.record')}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="mt-4">
                    <div 
                        onDrop={handleDrop}
                        onDragOver={handleDragEvents}
                        onDragEnter={handleDragEvents}
                        onDragLeave={handleDragEvents}
                        className={cn("aspect-video bg-muted rounded-md flex flex-col items-center justify-center relative p-1 text-center border-2 border-dashed transition-colors",
                            isDragging ? 'border-primary bg-primary/10' : 'border-transparent'
                        )}
                    >
                        {uploadedVideoUrl ? (
                        <video src={uploadedVideoUrl} controls className="w-full h-full rounded-md" />
                        ) : (
                        <>
                            <Upload className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground px-4">{t('feedbackTool.upload.description')}</p>
                            <Button variant="link" size="sm" className="mt-1" onClick={() => fileInputRef.current?.click()} disabled={isLoading || noCredits}>
                                {t('feedbackTool.upload.selectFile')}
                            </Button>
                        </>
                        )}
                        <Input ref={fileInputRef} type="file" accept="video/*" className="sr-only" onChange={handleFileChange} disabled={isLoading || noCredits} />
                    </div>
                </TabsContent>
              </Tabs>
           </div>
           
           <div className="space-y-4">
                <Button onClick={handleAnalyze} className="w-full" size="lg" disabled={isAnalyzeButtonDisabled || !videoToAnalyze}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2" />}
                    {t('feedbackTool.buttons.analyze')} ({t('feedbackTool.credits_one')})
                </Button>
                {noCredits && (
                    <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('feedbackTool.noCredits.title')}</AlertTitle>
                    <AlertDescription>
                        {t('feedbackTool.noCredits.description')}
                        <Button variant="secondary" className="mt-2 w-full" onClick={() => router.push('/store')}>
                           <ShoppingBag className="mr-2" /> {t('feedbackTool.noCredits.buyMore')}
                        </Button>
                    </AlertDescription>
                    </Alert>
                )}
           </div>
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
        <CardContent className="space-y-4 text-sm min-h-[28rem] relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground bg-background/50 backdrop-blur-sm z-10 rounded-b-lg">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>{t('feedbackTool.feedbackCard.loading')}</span>
            </div>
          )}
          {feedback?.isCorrect === true && (
             <div className="flex flex-col items-center justify-center text-center gap-4 text-green-500 p-8 h-full">
                <CheckCircle className="h-16 w-16" />
                <h3 className="text-2xl font-bold font-headline">{t('feedbackTool.feedbackCard.allGood.title')}</h3>
                <p className="text-base text-muted-foreground">{t('feedbackTool.feedbackCard.allGood.description')}</p>
            </div>
          )}
          {feedback && !feedback.isCorrect && feedback.feedback.length > 0 && (
            <div className="space-y-4">
              {feedback.feedback.map((item, index) => (
                <div key={index} className="p-4 rounded-lg bg-secondary/50">
                    <h4 className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-primary"/>{item.point}</h4>
                    <p className="text-muted-foreground mt-1 text-sm">{item.correction}</p>
                </div>
              ))}
            </div>
          )}
          {!isLoading && !feedback && (
             <div className="flex flex-col items-center justify-center text-center gap-2 text-muted-foreground p-8 h-full">
                <Sparkles className="h-16 w-16" />
                <p className="text-base">{t('feedbackTool.feedbackCard.prompt')}</p>
            </div>
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

    