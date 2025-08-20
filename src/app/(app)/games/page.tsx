
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Zap, Lightbulb, Gamepad2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriviaGame } from './trivia-game';
import { MultipleChoiceQuiz } from './multiple-choice-quiz';
import { cn } from '@/lib/utils';

type Game = 'trivia' | 'quiz' | null;

const games = [
    { id: 'trivia', title: 'Mito o Realidad', icon: Zap },
    { id: 'quiz', title: 'Preguntados', icon: Lightbulb },
]

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<Game>(null);


  const handleGameSelect = (gameId: Game) => {
    setActiveGame(gameId);
  }

  const renderGame = () => {
    switch(activeGame) {
        case 'trivia':
            return <TriviaGame onGameFinish={() => setActiveGame(null)} />;
        case 'quiz':
            return <MultipleChoiceQuiz onGameFinish={() => setActiveGame(null)} />;
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
                      <Button variant="ghost" size="icon" onClick={() => setActiveGame(null)}>
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
                      Zona de Juegos
                      </CardTitle>
                      <CardDescription>
                      ¡Aprende y diviértete!
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
