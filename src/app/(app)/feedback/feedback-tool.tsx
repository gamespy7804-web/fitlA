
'use client';

import { useEffect, useState, useRef, Suspense, useCallback, DragEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { realTimeFeedback, type RealTimeFeedbackOutput } from '@/ai/flows/real-time-feedback-generator';
import { analyzePhysique, type PhysiqueAnalysisOutput } from '@/ai/flows/physique-analyst-generator';
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
import { Camera, Loader2, Sparkles, Video, AlertTriangle, Upload, CheckCircle, Info, ShoppingBag, ArrowRight, ArrowLeft, Image as ImageIcon, Gauge, Percent, BarChart, BrainCircuit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useI18n } from '@/i18n/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/hooks/use-user-data';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

type Step = 'selectExercise' | 'provideVideo' | 'analyzing' | 'showResult';
type PhysiqueStep = 'upload' | 'analyzing' | 'result';

const stepVariants = {
  hidden: (direction: 'forward' | 'backward') => ({
    opacity: 0,
    x: direction === 'forward' ? '50%' : '-50%',
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 260, damping: 30 }
  },
  exit: (direction: 'forward' | 'backward') => ({
    opacity: 0,
    x: direction === 'forward' ? '-50%' : '50%',
    transition: { duration: 0.2 }
  }),
};


function FeedbackToolContent() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  const [step, setStep] = useState<Step>('selectExercise');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const { pendingFeedback, diamonds, removePendingFeedback, consumeDiamonds } = useUserData();

  const [feedback, setFeedback] = useState<RealTimeFeedbackOutput | null>(null);
  const [exercisesForFeedback, setExercisesForFeedback] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [customExercise, setCustomExercise] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true); // Assume true initially to avoid flash of error
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [videoToAnalyze, setVideoToAnalyze] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Physique analysis state
  const [physiqueStep, setPhysiqueStep] = useState<PhysiqueStep>('upload');
  const physiqueFileInputRef = useRef<HTMLInputElement>(null);
  const [isPhysiqueDragging, setIsPhysiqueDragging] = useState(false);
  const [physiquePhotoToAnalyze, setPhysiquePhotoToAnalyze] = useState<string | null>(null);
  const [physiquePhotoUrl, setPhysiquePhotoUrl] = useState<string | null>(null);
  const [physiqueAnalysis, setPhysiqueAnalysis] = useState<PhysiqueAnalysisOutput | null>(null);


  const { toast } = useToast();
  
  const exerciseFromParam = searchParams.get('exercise');
  const TECHNIQUE_ANALYSIS_COST = 10;
  const PHYSIQUE_ANALYSIS_COST = 25;


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
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  const handleStartRecording = () => {
    if (videoRef.current?.srcObject) {
      setVideoToAnalyze(null);
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


  const handleTechniqueAnalyze = async () => {
    setDirection('forward');
    setStep('analyzing');
    
    try {
      consumeDiamonds(TECHNIQUE_ANALYSIS_COST);
      const result: RealTimeFeedbackOutput = await realTimeFeedback({
        videoDataUri: videoToAnalyze!,
        exerciseType: customExercise.trim() || selectedExercise,
        language: locale,
      });
      setFeedback(result);
      setStep('showResult');

      const exerciseToAnalyze = customExercise.trim() || selectedExercise;
      if (pendingFeedback?.includes(exerciseToAnalyze)) {
        removePendingFeedback(exerciseToAnalyze);
      }

    } catch (error) {
      console.error('Error providing feedback:', error);
      toast({
        variant: 'destructive',
        title: t('feedbackTool.analysisFailed.title'),
        description: t('feedbackTool.analysisFailed.description'),
      });
      // TODO: refund diamonds
      setStep('provideVideo');
    }
  };
  
  const handlePhysiqueAnalyze = async () => {
    setPhysiqueStep('analyzing');
    try {
      consumeDiamonds(PHYSIQUE_ANALYSIS_COST);
      const result = await analyzePhysique({
        photoDataUri: physiquePhotoToAnalyze!,
        language: locale
      });
      setPhysiqueAnalysis(result);
      setPhysiqueStep('result');
    } catch (error) {
      console.error('Error analyzing physique:', error);
      toast({
        variant: 'destructive',
        title: t('feedbackTool.physiqueAnalysis.errors.title'),
        description: t('feedbackTool.physiqueAnalysis.errors.description'),
      });
      setPhysiqueStep('upload');
    }
  };

  const resetFlow = () => {
    setFeedback(null);
    setSelectedExercise(pendingFeedback?.[0] ?? '');
    setCustomExercise('');
    setUploadedVideoUrl(null);
    setVideoToAnalyze(null);
    setRecordedChunks([]);
    setDirection('backward');
    setStep('selectExercise');
  }

  const processVideoFile = (file: File) => {
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
  
  const processPhysiqueFile = (file: File) => {
     if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: t('feedbackTool.physiqueAnalysis.upload.invalidFileType') });
        return;
    }
    if (physiquePhotoUrl) {
      URL.revokeObjectURL(physiquePhotoUrl);
    }
    const newUrl = URL.createObjectURL(file);
    setPhysiquePhotoUrl(newUrl);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (dataUri) {
        setPhysiquePhotoToAnalyze(dataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processVideoFile(file);
  };
  
   const handlePhysiqueFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processPhysiqueFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processVideoFile(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
    }
  };
  
  const handlePhysiqueDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhysiqueDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processPhysiqueFile(e.dataTransfer.files[0]);
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
  
  const handlePhysiqueDragEvents = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsPhysiqueDragging(true);
    } else if (e.type === 'dragleave') {
      setIsPhysiqueDragging(false);
    }
  };

  const handleTabChange = () => {
    setUploadedVideoUrl(null);
    setVideoToAnalyze(null);
    setRecordedChunks([]);
  }
  
  const exerciseIsSelected = !!customExercise.trim() || !!selectedExercise;
  
  const renderTechniqueAnalysis = () => (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <AnimatePresence mode="wait" custom={direction}>
        {renderStep()}
      </AnimatePresence>
    </div>
  );
  
  const renderPhysiqueAnalysis = () => {
    const hasEnoughDiamonds = (diamonds ?? 0) >= PHYSIQUE_ANALYSIS_COST;
    
    switch (physiqueStep) {
        case 'upload':
            return (
                <motion.div key="physiqueUpload" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="font-headline">{t('feedbackTool.physiqueAnalysis.step1_title')}</CardTitle>
                                <div className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-3 py-1.5 rounded-md text-sm border">
                                    <span role="img" aria-label="diamond">💎</span>
                                    <span>{diamonds ?? 0}</span>
                                </div>
                            </div>
                           <CardDescription>{t('feedbackTool.physiqueAnalysis.step1_description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div onDrop={handlePhysiqueDrop} onDragOver={handlePhysiqueDragEvents} onDragEnter={handlePhysiqueDragEvents} onDragLeave={handlePhysiqueDragEvents} className={cn("aspect-video bg-muted rounded-md flex flex-col items-center justify-center relative p-1 text-center border-2 border-dashed transition-colors", isPhysiqueDragging ? 'border-primary bg-primary/10' : 'border-transparent')}>
                                {physiquePhotoUrl ? <img src={physiquePhotoUrl} alt={t('feedbackTool.physiqueAnalysis.upload.alt')} className="w-full h-full rounded-md object-contain" /> : (<><ImageIcon className="h-12 w-12 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground px-4">{t('feedbackTool.physiqueAnalysis.upload.description')}</p><Button variant="link" size="sm" className="mt-1" onClick={() => physiqueFileInputRef.current?.click()} disabled={!hasEnoughDiamonds}>{t('feedbackTool.physiqueAnalysis.upload.selectFile')}</Button></>)}
                                <Input ref={physiqueFileInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhysiqueFileChange} disabled={!hasEnoughDiamonds} />
                            </div>
                            <div className="mt-6 space-y-4">
                                <Button onClick={handlePhysiqueAnalyze} className="w-full" size="lg" disabled={!physiquePhotoToAnalyze || !hasEnoughDiamonds}>
                                    <Sparkles className="mr-2" />
                                    {t('feedbackTool.physiqueAnalysis.buttons.analyze')} ({PHYSIQUE_ANALYSIS_COST} 💎)
                                </Button>
                                {!hasEnoughDiamonds && (
                                    <Alert variant="destructive">
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
                </motion.div>
            );
        case 'analyzing':
            return (
                 <motion.div key="physiqueAnalyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center gap-4 text-primary p-8 h-full min-h-[50vh]">
                    <Loader2 className="h-16 w-16 animate-spin" />
                    <h3 className="text-2xl font-bold font-headline">{t('feedbackTool.physiqueAnalysis.loading.title')}</h3>
                    <p className="text-base text-muted-foreground">{t('feedbackTool.physiqueAnalysis.loading.description')}</p>
                 </motion.div>
            );
        case 'result':
            const StatCard = ({ icon, title, value, unit, progress, color }: { icon: React.ElementType, title: string, value: number, unit: string, progress: number, color: string }) => (
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <icon className={cn("w-8 h-8", color)} />
                        <div>
                            <p className="text-sm text-muted-foreground">{title}</p>
                            <p className="text-2xl font-bold">{value}{unit}</p>
                        </div>
                    </div>
                    <Progress value={progress} className="mt-3 h-2"/>
                </Card>
            );
            return (
                <motion.div key="physiqueResult" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                <Sparkles className="text-primary" /> {t('feedbackTool.physiqueAnalysis.results.title')}
                            </CardTitle>
                            <CardDescription>{t('feedbackTool.physiqueAnalysis.results.description')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {physiqueAnalysis && (
                                <>
                                 <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center justify-between">
                                            <span>{t('feedbackTool.physiqueAnalysis.results.averageScore')}</span>
                                            <span className="text-primary">{physiqueAnalysis.averageScore}/10</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Progress value={physiqueAnalysis.averageScore * 10} className="h-3"/>
                                    </CardContent>
                                 </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <StatCard icon={Gauge} title={t('feedbackTool.physiqueAnalysis.results.potential')} value={physiqueAnalysis.potentialScore} unit="/10" progress={physiqueAnalysis.potentialScore * 10} color="text-green-500" />
                                     <StatCard icon={BarChart} title={t('feedbackTool.physiqueAnalysis.results.symmetry')} value={physiqueAnalysis.symmetryScore} unit="/10" progress={physiqueAnalysis.symmetryScore * 10} color="text-blue-500" />
                                     <StatCard icon={BrainCircuit} title={t('feedbackTool.physiqueAnalysis.results.genetics')} value={physiqueAnalysis.geneticsScore} unit="/10" progress={physiqueAnalysis.geneticsScore * 10} color="text-purple-500" />
                                     <StatCard icon={Percent} title={t('feedbackTool.physiqueAnalysis.results.bodyFat')} value={physiqueAnalysis.bodyFatPercentage} unit="%" progress={physiqueAnalysis.bodyFatPercentage} color="text-orange-500" />
                                </div>
                                
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">{t('feedbackTool.physiqueAnalysis.results.feedbackTitle')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{physiqueAnalysis.feedback}</p>
                                    </CardContent>
                                </Card>
                                </>
                            )}
                            <Button onClick={() => setPhysiqueStep('upload')} className="w-full">
                                {t('feedbackTool.buttons.analyzeAnother')}
                            </Button>
                        </CardContent>
                     </Card>
                </motion.div>
            );
    }
  }

  const renderStep = () => {
    const hasEnoughDiamondsForTechnique = (diamonds ?? 0) >= TECHNIQUE_ANALYSIS_COST;
    switch (step) {
      case 'selectExercise':
        return (
          <motion.div key="selectExercise" custom={direction} variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="font-headline">{t('feedbackTool.step1')}</CardTitle>
                  <div className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-3 py-1.5 rounded-md text-sm border">
                    <span role="img" aria-label="diamond">💎</span>
                    <span>{diamonds ?? 0}</span>
                  </div>
                </div>
                <CardDescription>{t('feedbackTool.step1_description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select onValueChange={setSelectedExercise} value={selectedExercise} disabled={isRecording}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('feedbackTool.selectExercisePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {exercisesForFeedback.length > 0 ? (
                      exercisesForFeedback.map(ex => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)
                    ) : (
                      <SelectItem value="none" disabled>{t('feedbackTool.noPendingExercises')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div>
                  <Label htmlFor="custom-exercise" className='text-xs text-muted-foreground'>{t('feedbackTool.customExerciseLabel')}</Label>
                  <Input id="custom-exercise" placeholder={t('feedbackTool.customExercisePlaceholder')} value={customExercise} onChange={(e) => setCustomExercise(e.target.value)} disabled={isRecording} />
                </div>
                 <Button className="w-full" disabled={!exerciseIsSelected} onClick={() => { setDirection('forward'); setStep('provideVideo'); }}>
                  {t('onboarding.buttons.next')} <ArrowRight className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'provideVideo':
        return (
          <motion.div key="provideVideo" custom={direction} variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-headline">{t('feedbackTool.step2')}</CardTitle>
                    <div className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-3 py-1.5 rounded-md text-sm border">
                        <span role="img" aria-label="diamond">💎</span>
                        <span>{diamonds ?? 0}</span>
                    </div>
                </div>
                <CardDescription>{t('feedbackTool.step2_description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="camera" className="w-full" onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera" disabled={!hasEnoughDiamondsForTechnique}><Camera className="mr-2 h-4 w-4" />{t('feedbackTool.tabs.camera')}</TabsTrigger>
                    <TabsTrigger value="upload" disabled={!hasEnoughDiamondsForTechnique}><Upload className="mr-2 h-4 w-4" />{t('feedbackTool.tabs.upload')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="camera" className="mt-4">
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative">
                      <video ref={videoRef} className="w-full h-full rounded-md" autoPlay muted playsInline />
                      {isRecording && <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                    {!hasCameraPermission && <Alert variant="destructive" className="mt-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('feedbackTool.cameraError.title')}</AlertTitle><AlertDescription>{t('feedbackTool.cameraError.description')}</AlertDescription></Alert>}
                    <div className="mt-4 flex gap-4">
                      <Button onClick={isRecording ? handleStopRecording : handleStartRecording} className="w-full" disabled={!hasEnoughDiamondsForTechnique || !hasCameraPermission}>
                        {isRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2" />}
                        {isRecording ? t('feedbackTool.buttons.stop') : t('feedbackTool.buttons.record')}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="upload" className="mt-4">
                    <div onDrop={handleDrop} onDragOver={handleDragEvents} onDragEnter={handleDragEvents} onDragLeave={handleDragEvents} className={cn("aspect-video bg-muted rounded-md flex flex-col items-center justify-center relative p-1 text-center border-2 border-dashed transition-colors", isDragging ? 'border-primary bg-primary/10' : 'border-transparent')}>
                      {uploadedVideoUrl ? <video src={uploadedVideoUrl} controls className="w-full h-full rounded-md" /> : (<><Upload className="h-12 w-12 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground px-4">{t('feedbackTool.upload.description')}</p><Button variant="link" size="sm" className="mt-1" onClick={() => fileInputRef.current?.click()} disabled={!hasEnoughDiamondsForTechnique}>{t('feedbackTool.upload.selectFile')}</Button></>)}
                      <Input ref={fileInputRef} type="file" accept="video/*" className="sr-only" onChange={handleFileChange} disabled={!hasEnoughDiamondsForTechnique} />
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-6 space-y-4">
                    <Button onClick={handleTechniqueAnalyze} className="w-full" size="lg" disabled={!videoToAnalyze || !hasEnoughDiamondsForTechnique}>
                        <Sparkles className="mr-2" />
                        {t('feedbackTool.buttons.analyze')} ({TECHNIQUE_ANALYSIS_COST} 💎)
                    </Button>
                    {!hasEnoughDiamondsForTechnique && (
                        <Alert variant="destructive">
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
                     <Button variant="ghost" onClick={() => { setDirection('backward'); setStep('selectExercise'); }} className="w-full">
                        <ArrowLeft className="mr-2" />
                        {t('onboarding.buttons.back')}
                    </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'analyzing':
        return (
          <motion.div key="analyzing" custom={direction} variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center text-center gap-4 text-primary p-8 h-full min-h-[50vh]">
            <Loader2 className="h-16 w-16 animate-spin" />
            <h3 className="text-2xl font-bold font-headline">{t('feedbackTool.feedbackCard.loading')}</h3>
            <p className="text-base text-muted-foreground">{t('feedbackTool.feedbackCard.loadingDescription')}</p>
          </motion.div>
        );

      case 'showResult':
        return (
          <motion.div key="showResult" custom={direction} variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <Sparkles className="text-primary" /> {t('feedbackTool.feedbackCard.title')}
                </CardTitle>
                <CardDescription>{t('feedbackTool.feedbackCard.resultsFor')} {customExercise.trim() || selectedExercise}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {feedback?.isCorrect ? (
                  <div className="flex flex-col items-center justify-center text-center gap-4 text-green-500 p-8">
                    <CheckCircle className="h-16 w-16" />
                    <h3 className="text-2xl font-bold font-headline">{t('feedbackTool.feedbackCard.allGood.title')}</h3>
                    <p className="text-base text-muted-foreground">{t('feedbackTool.feedbackCard.allGood.description')}</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                    {feedback?.feedback.map((item, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <span className='font-semibold'>{item.summary}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <h4 className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-primary" />{item.point}</h4>
                          <p className="text-muted-foreground text-sm">{item.correction}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
                <Button onClick={resetFlow} className="w-full mt-6">
                  {t('feedbackTool.buttons.analyzeAnother')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className='w-full max-w-2xl mx-auto'>
        <Tabs defaultValue="technique" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="technique">{t('feedbackTool.tabs.techniqueAnalysis')}</TabsTrigger>
                <TabsTrigger value="physique">{t('feedbackTool.tabs.physiqueAnalysis')}</TabsTrigger>
            </TabsList>
            <TabsContent value="technique" className="mt-6">
                {renderTechniqueAnalysis()}
            </TabsContent>
            <TabsContent value="physique" className="mt-6">
                {renderPhysiqueAnalysis()}
            </TabsContent>
        </Tabs>
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
