
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/client';

interface RestTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
}

export function RestTimer({ duration, onComplete }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const { t } = useI18n();

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = (duration - timeLeft) / duration;

  const handleSkip = () => {
    onComplete();
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="text-2xl font-headline text-muted-foreground mb-4">{t('restTimer.title')}</p>
        <div className="relative w-64 h-64">
           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
             <circle className="stroke-current text-border" strokeWidth="5" cx="50" cy="50" r="45" fill="transparent" />
             <motion.circle
                className="stroke-current text-primary"
                strokeWidth="5"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                strokeDasharray="282.6"
                strokeDashoffset={282.6 * (1 - progress)}
                transform="rotate(-90 50 50)"
                transition={{ duration: 1, ease: 'linear' }}
             />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-7xl font-bold font-mono">{formatTime(timeLeft)}</h1>
           </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="mt-8 text-muted-foreground"
        >
          {t('restTimer.skip')}
        </Button>
      </motion.div>
    </div>
  );
}
