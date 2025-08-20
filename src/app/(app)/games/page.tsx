
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Zap, Lightbulb, Gamepad2, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriviaGame } from './trivia-game';
import { MultipleChoiceQuiz } from './multiple-choice-quiz';

type Game = 'trivia' | 'quiz' | null;

const games = [
    { id: 'trivia', title: 'Trivia: ¿Mito o Realidad?', icon: Zap },
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {activeGame && (
          <Button variant="ghost" size="icon" onClick={() => setActiveGame(null)}>
             <ArrowLeft />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            {activeGame ? games.find(g => g.id === activeGame)?.title : 'Juegos de Fitness'}
          </h1>
          <p className="text-muted-foreground">
            {activeGame ? 'Diviértete mientras aprendes.' : 'Elige un juego para empezar.'}
          </p>
        </div>
      </div>
      <Card className="min-h-[24rem] flex flex-col justify-center items-center p-4">
        <AnimatePresence mode="wait">
          {activeGame ? (
             <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full flex flex-col justify-center items-center"
              >
               {renderGame()}
             </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <CardHeader className="text-center">
                <CardTitle className="font-headline flex items-center justify-center gap-2">
                  <Gamepad2 className="text-primary"/>
                  Elige un Juego
                </CardTitle>
                <CardDescription>
                  ¡Aprende y diviértete!
                </CardDescription>
              </CardHeader>
              <CardContent className="max-w-md mx-auto w-full space-y-2">
                {games.map((game) => (
                    <Button 
                        key={game.id} 
                        variant="outline" 
                        className="w-full justify-between h-auto p-4 text-left"
                        onClick={() => handleGameSelect(game.id as Game)}
                    >
                        <div className="flex items-center gap-4">
                            <game.icon className="text-primary" />
                            <p className="font-semibold">{game.title}</p>
                        </div>
                        <ChevronRight />
                    </Button>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
