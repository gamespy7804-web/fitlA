
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Zap, Lightbulb, Gamepad2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriviaGame } from './trivia-game';
import { MultipleChoiceQuiz } from './multiple-choice-quiz';

type Game = 'trivia' | 'quiz' | null;

const games = [
    { id: 'trivia', title: 'Trivia: ¿Mito o Realidad?', description: 'Las preguntas se adaptan a tu nivel. ¡Desafía tu conocimiento!', icon: Zap },
    { id: 'quiz', title: 'Preguntados de Fitness', description: 'Pon a prueba tu conocimiento con preguntas de opción múltiple.', icon: Lightbulb },
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
            Juegos de Fitness
          </h1>
          <p className="text-muted-foreground">
            {activeGame ? 'Diviértete mientras aprendes.' : 'Pon a prueba tus conocimientos y aprende a entrenar de forma más inteligente.'}
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
              <CardContent className="grid gap-4 md:grid-cols-2">
                {games.map((game) => (
                    <Card key={game.id} className="hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline">
                                <game.icon className="text-primary" />
                                {game.title}
                            </CardTitle>
                            <CardDescription>{game.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" onClick={() => handleGameSelect(game.id as Game)}>
                                Jugar Ahora
                            </Button>
                        </CardContent>
                    </Card>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
