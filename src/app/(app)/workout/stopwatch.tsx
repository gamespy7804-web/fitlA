
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw, Check } from 'lucide-react';
import { useI18n } from '@/i18n/client';

interface StopwatchProps {
  onDone: (time: number) => void;
}

export function Stopwatch({ onDone }: StopwatchProps) {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
  };

  const handleDone = () => {
    onDone(time);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center flex flex-col items-center gap-8"
      >
        <p className="text-2xl font-headline text-muted-foreground">{t('stopwatch.title')}</p>
        
        <h1 className="text-8xl font-bold font-mono tracking-widest">{formatTime(time)}</h1>

        <div className='flex items-center gap-4'>
            <Button size="icon" variant="outline" onClick={handleReset}>
                <RotateCcw/>
            </Button>
            <Button size="lg" className='w-32' onClick={handleStartPause}>
                {isActive ? <Pause className="mr-2"/> : <Play className="mr-2" />}
                {isActive ? t('stopwatch.pause') : t('stopwatch.start')}
            </Button>
            <Button size="icon" variant="outline" onClick={handleDone}>
                <Check />
            </Button>
        </div>
      </motion.div>
    </div>
  );
}
