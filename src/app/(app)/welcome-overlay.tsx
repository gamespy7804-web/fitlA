
'use client';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/client';

interface WelcomeOverlayProps {
  show: boolean;
  onClick: () => void;
}

export function WelcomeOverlay({ show, onClick }: WelcomeOverlayProps) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1, transition: { delay: 0.2, duration: 0.5 } }}
             className="text-center p-8 flex flex-col items-center"
          >
            <Logo className="h-24 w-24 text-primary" />
            <h1 className="mt-6 text-4xl font-bold font-headline text-foreground">
              {t('welcome.title')}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {t('welcome.subtitle')}
            </p>
            <Button size="lg" className="mt-8 text-lg" onClick={onClick}>
              <Sparkles className="mr-2" />
              {t('welcome.button')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
