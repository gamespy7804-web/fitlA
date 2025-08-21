
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Zap, Lightbulb, Gamepad2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriviaGame } from './trivia-game';
import { MultipleChoiceQuiz } from './multiple-choice-quiz';
import { cn } from '@/lib/utils';
import { startMusic, stopMusic } from '@/hooks/use-audio-effects';
import { useI18n } from '@/i18n/client';

type Game = 'trivia' | 'quiz' | null;

export default function GamesPage() {
  const { t } = useI18n();
  const [activeGame, setActiveGame] = useState<Game>(null);

  const games = [
    { id: 'trivia', title: t('gamesPage.trivia.title'), icon: Zap },
    { id: 'quiz', title: t('gamesPage.quiz.title'), icon: Lightbulb },
  ]

  useEffect(() => {
    startMusic('game');
    return () => {
      startMusic('main');
    }
  }, []);

  const handleGameSelect = (gameId: Game) => {
    setActiveGame(gameId);
  }
  
  const handleGoBackToMenu = () => {
    setActiveGame(null);
    startMusic('game'); 
  }


  const renderGame = () => {
    switch(activeGame) {
        case 'trivia':
            return <TriviaGame onGameFinish={handleGoBackToMenu} />;
        case 'quiz':
            return <MultipleChoiceQuiz onGameFinish={handleGoBackToMenu} />;
        default:
            return null;
    }
  }


  return (
    <div className="game-theme min-h-screen w-full">
       <div className="container mx-auto py-8">
         <AnimatePresence mode="wait">
          {activeGame ? (
              <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full min-h-[calc(100vh-120px)] h-full flex flex-col justify-center items-center"
              >
                  <div className="w-full flex justify-start mb-4">
                      <Button variant="ghost" size="icon" onClick={handleGoBackToMenu}>
                          <ArrowLeft />
                      </Button>
                  </div>
                  {renderGame()}
              </motion.div>
          ) : (
              <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full min-h-[calc(100vh-120px)] flex flex-col justify-center items-center"
              >
              <Card className="max-w-md mx-auto w-full border-2">
                   <CardHeader className="text-center">
                      <CardTitle className="font-headline flex items-center justify-center gap-2 text-3xl">
                      <Gamepad2 className="text-primary h-8 w-8"/>
                      {t('gamesPage.title')}
                      </CardTitle>
                      <CardDescription>
                      {t('gamesPage.description')}
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      {games.map((game) => (
                          <Button 
                              key={game.id} 
                              variant="outline" 
                              className="w-full justify-between h-auto p-4 py-6 text-left rounded-xl text-base border-2"
                              onClick={() => handleGameSelect(game.id as Game)}
                          >
                              <div className="flex items-center gap-4">
                                  <game.icon className="text-primary h-6 w-6" />
                                  <p className="font-semibold">{game.title}</p>
                              </div>
                              <ChevronRight />
                          </Button>
                      ))}
                  </CardContent>
              </Card>
              </motion.div>
          )}
          </AnimatePresence>
       </div>
    </div>
  );
}
