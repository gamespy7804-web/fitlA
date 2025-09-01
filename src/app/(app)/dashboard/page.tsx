
'use client';

import { WorkoutNodePath } from './workout-node-path';
import { PerformanceFeedback } from './performance-feedback';
import { useI18n } from '@/i18n/client';
import { AdBanner } from '@/components/ad-banner';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatbotSheet } from '@/components/chatbot/chatbot-sheet';
import { useState } from 'react';
import { WorkoutGeneratorDialog } from './workout-generator-dialog';

export default function DashboardPage() {
  const { t } = useI18n();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {t('dashboard.title')}
          </h1>
          <PerformanceFeedback />
        </div>
        <Button variant="ghost" size="icon" className="fixed top-20 right-4 z-10 bg-background/50 backdrop-blur-sm" id="chatbot-button" onClick={() => setIsChatbotOpen(true)}>
          <MessageSquare className="h-6 w-6 text-primary" />
        </Button>
      </div>

      <WorkoutNodePath />

      <AdBanner
        title="Potencia Tu Nutrición"
        description="Descubre planes de comida personalizados para complementar tu entrenamiento y alcanzar tus metas más rápido."
        buttonText="Obtener Plan"
        imageUrl="https://picsum.photos/800/200"
        data-ai-hint="nutrition healthy food"
      />
      
      <ChatbotSheet 
          open={isChatbotOpen} 
          onOpenChange={setIsChatbotOpen}
          onOpenGenerator={() => {
            setIsChatbotOpen(false);
            setIsGeneratorOpen(true);
          }} 
      />
       <WorkoutGeneratorDialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen} />
    </div>
  );
}
