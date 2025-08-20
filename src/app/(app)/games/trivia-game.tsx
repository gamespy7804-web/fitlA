
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { generateTrivia, type TriviaQuestion } from '@/ai/flows/trivia-generator';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

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

  useEffect(() => {
    const startGame = async () => {
        setGameState('loading');
        setSessionHistory([]);
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
    }
    startGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (answer: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.isMyth;
    
    if (isCorrect) {
      setScore(score + 1);
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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer(null);
      setGameState('playing');
    } else {
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
            <Button size="lg" onClick={onGameFinish}>Volver al Menú</Button>
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
      );
  }

  return null;
}
