
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, CheckCircle, XCircle, ChevronRight, RotateCw } from 'lucide-react';
import { generateTrivia, type TriviaQuestion } from '@/ai/flows/trivia-generator';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { useSound } from '@/hooks/use-sound';

type GameState = 'loading' | 'playing' | 'answered' | 'finished';
type TriviaHistory = {
    statement: string;
    isMyth: boolean;
    userAnswer: boolean;
    isCorrect: boolean;
}

export function TriviaGame({ onGameFinish }: { onGameFinish: () => void }) {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [sessionHistory, setSessionHistory] = useState<TriviaHistory[]>([]);
  const { toast } = useToast();
  const { playSound } = useSound();

  const startGame = useCallback(async () => {
    setGameState('loading');
    setSessionHistory([]);
    playSound('swoosh');
    try {
      const storedRoutine = localStorage.getItem('workoutRoutine');
      if (!storedRoutine) {
        toast({ variant: 'destructive', title: 'Error', description: 'Crea una rutina primero para poder jugar.' });
        onGameFinish();
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
        onGameFinish();
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron generar las preguntas. Inténtalo de nuevo.' });
      onGameFinish();
    }
  }, [onGameFinish, toast, playSound]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleAnswer = (answer: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer !== currentQuestion.isMyth;
    
    if (isCorrect) {
      setScore(score + 1);
      playSound('success-1');
    } else {
      playSound('error-1');
    }
    
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
    playSound('swoosh');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer(null);
      setGameState('playing');
    } else {
      playSound('success-2');
      const fullHistory = JSON.parse(localStorage.getItem('triviaHistory') || '[]') as TriviaHistory[];
      const updatedHistory = [...fullHistory, ...sessionHistory];
      localStorage.setItem('triviaHistory', JSON.stringify(updatedHistory));
      setGameState('finished');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswerCorrect = userAnswer !== null && userAnswer !== currentQuestion?.isMyth;

  if (gameState === 'loading') {
    return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Generando tu trivia...</p>
        </div>
    );
  }

  if (gameState === 'finished') {
     return (
        <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-4 flex flex-col items-center justify-center h-full"
        >
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">¡Juego Terminado!</h2>
            <p className="text-xl text-muted-foreground mb-4">
                Tu puntuación final es:
            </p>
            <p className="text-6xl font-bold text-primary mb-6">{score} / {questions.length}</p>
            <div className="flex items-center gap-4">
              <Button size="lg" variant="outline" onClick={onGameFinish}>Volver al Menú</Button>
              <Button size="lg" onClick={startGame}>
                <RotateCw className="mr-2" />
                Jugar de Nuevo
              </Button>
            </div>
        </motion.div>
     )
  }

  if (currentQuestion) {
    return (
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
              <Card className={`p-4 ${isAnswerCorrect ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isAnswerCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                  <h3 className="font-bold text-lg">{isAnswerCorrect ? '¡Correcto!' : '¡Incorrecto!'}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              </Card>
              <Button onClick={handleNextQuestion} className="mt-4">
                {currentQuestionIndex < questions.length - 1 ? 'Siguiente' : 'Ver Resultados'} <ChevronRight className="ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      );
  }

  return null;
}
