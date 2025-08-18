'use client';

import { useState } from 'react';
import { realTimeFeedback } from '@/ai/flows/real-time-feedback-generator';
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
import { Camera, Loader2, Sparkles, Video } from 'lucide-react';

export function FeedbackTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [exercise, setExercise] = useState<string>('Barbell Squat');
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      // In a real app, you would get the video data URI from a camera component.
      // We use a placeholder data URI for demonstration.
      const placeholderVideoDataUri = 'data:video/mp4;base64,'; 
      const result = await realTimeFeedback({
        videoDataUri: placeholderVideoDataUri,
        exerciseType: exercise,
      });
      setFeedback(result.feedback);
    } catch (error) {
      console.error('Error providing feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the video. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      handleAnalyze();
    } else {
      setIsRecording(true);
      setFeedback(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Live Camera Feed</CardTitle>
          <CardDescription>Position yourself so your full body is visible.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Camera className="mx-auto h-12 w-12" />
              <p>Camera feed is off</p>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <Select onValueChange={setExercise} defaultValue={exercise}>
              <SelectTrigger>
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Barbell Squat">Barbell Squat</SelectItem>
                <SelectItem value="Deadlift">Deadlift</SelectItem>
                <SelectItem value="Bench Press">Bench Press</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRecord} className="w-40" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Video className="mr-2" />
              )}
              {isRecording ? 'Stop' : 'Record'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Feedback
          </CardTitle>
          <CardDescription>Instant analysis of your form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing your form...</span>
            </div>
          )}
          {feedback && (
            <p className="whitespace-pre-wrap">{feedback}</p>
          )}
          {!isLoading && !feedback && (
            <p className="text-muted-foreground">
              Record a video of your exercise to get feedback.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
