
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, Zap, Trophy, Lightbulb, XCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { generateTrivia, type TriviaQuestion } from '@/ai/flows/trivia-generator';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type GameState = 'idle' | 'loading' | 'playing' | 'answered' | 'finished';
type TriviaHistory = {
    statement: string;
    isMyth: boolean;
    userAnswer: boolean;
    isCorrect: boolean;
}

export default function GamesPage() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [sessionHistory, setSessionHistory] = useState<TriviaHistory[]>([]);
  const { toast } = useToast();

  const handleStartGame = async () => {
    setGameState('loading');
    setSessionHistory([]); // Reset history for the new session
    try {
      const storedRoutine = localStorage.getItem('workoutRoutine');
      if (!storedRoutine) {
        toast({ variant: 'destructive', title: 'Error', description: 'Crea una rutina primero para poder jugar.' });
        setGameState('idle');
        return;
      }
      const parsedRoutine = JSON.parse(storedRoutine);
      const sport = parsedRoutine.sport || 'general fitness';
      
      const triviaHistory = localStorage.getItem('triviaHistory');

      const triviaData = await generateTrivia({ sport, history: triviaHistory ?? undefined });
      
      if (triviaData.questions && triviaData.questions.length > 0) {
        setQuestions(triviaData.questions);
        setScore(0);
        setCurrentQuestionIndex(0);
        setUserAnswer(null);
        setGameState('playing');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron generar nuevas preguntas de trivia.' });
        setGameState('idle');
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron generar las preguntas. Inténtalo de nuevo.' });
      setGameState('idle');
    }
  };

  const handleAnswer = (answer: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.isMyth;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Add to this session's history
    setSessionHistory(prev => [...prev, {
        statement: currentQuestion.statement,
        isMyth: currentQuestion.isMyth,
        userAnswer: answer,
        isCorrect: isCorrect,
    }]);

    setUserAnswer(answer);
    setGameState('answered');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer(null);
      setGameState('playing');
    } else {
      // Game finished, save session history to permanent storage
      const fullHistory = JSON.parse(localStorage.getItem('triviaHistory') || '[]') as TriviaHistory[];
      const updatedHistory = [...fullHistory, ...sessionHistory];
      localStorage.setItem('triviaHistory', JSON.stringify(updatedHistory));
      setGameState('finished');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswerCorrect = userAnswer !== null && currentQuestion !== null && userAnswer !== currentQuestion.isMyth;


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Juegos de Fitness
        </h1>
        <p className="text-muted-foreground">
          Pon a prueba tus conocimientos y aprende a entrenar de forma más inteligente.
        </p>
      </div>
      <Card className="min-h-[24rem] flex flex-col justify-center items-center p-4">
        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <CardHeader>
                <CardTitle className="font-headline flex items-center justify-center gap-2">
                  <Zap className="text-primary"/>
                  Trivia Adaptativa: ¿Mito o Realidad?
                </CardTitle>
                <CardDescription>
                  Las preguntas se adaptan a tu nivel. ¡Desafía tu conocimiento!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" onClick={handleStartGame}>
                  Empezar a Jugar
                </Button>
              </CardContent>
            </motion.div>
          )}

          {gameState === 'loading' && (
            <motion.div key="loading" className="flex items-center gap-2 text-lg text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              Generando preguntas para ti...
            </motion.div>
          )}

          {(gameState === 'playing' || gameState === 'answered') && currentQuestion && (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full text-center flex flex-col items-center"
            >
              <Badge className="mb-4">Pregunta {currentQuestionIndex + 1} de {questions.length}</Badge>
              <p className="text-xl md:text-2xl font-semibold mb-6 max-w-prose">{currentQuestion.statement}</p>
              
              {gameState === 'playing' && (
                  <motion.div initial={{opacity:0, scale: 0.8}} animate={{opacity: 1, scale: 1}} className="flex gap-4">
                    <Button variant="destructive" size="lg" onClick={() => handleAnswer(true)}>Mito</Button>
                    <Button variant="default" className="bg-green-600 hover:bg-green-700" size="lg" onClick={() => handleAnswer(false)}>Realidad</Button>
                  </motion.div>
              )}

              {gameState === 'answered' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-prose"
                >
                  <Card className={`p-4 ${!isAnswerCorrect ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {!isAnswerCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                      <h3 className="font-bold text-lg">{!isAnswerCorrect ? '¡Correcto!' : '¡Incorrecto!'}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                  </Card>
                  <Button onClick={handleNextQuestion} className="mt-4">
                    {currentQuestionIndex < questions.length - 1 ? 'Siguiente' : 'Ver Resultados'} <ChevronRight className="ml-2" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {gameState === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-4"
            >
                <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">¡Juego Terminado!</h2>
                <p className="text-xl text-muted-foreground mb-4">
                    Tu puntuación final es:
                </p>
                <p className="text-6xl font-bold text-primary mb-6">{score} / {questions.length}</p>
                <Button size="lg" onClick={handleStartGame}>Jugar de Nuevo</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
