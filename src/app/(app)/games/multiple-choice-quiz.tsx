
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { generateMultipleChoiceQuiz, type MultipleChoiceQuestion } from '@/ai/flows/multiple-choice-quiz-generator';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type GameState = 'loading' | 'playing' | 'answered' | 'finished';
type QuizHistory = {
    question: string;
    userAnswerIndex: number;
    correctAnswerIndex: number;
    isCorrect: boolean;
}

export function MultipleChoiceQuiz({ onGameFinish }: { onGameFinish: () => void }) {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswerIndex, setUserAnswerIndex] = useState<number | null>(null);
  const [sessionHistory, setSessionHistory] = useState<QuizHistory[]>([]);
  const { toast } = useToast();
  const feedbackRef = useRef<HTMLDivElement>(null);

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
          
          const quizHistory = localStorage.getItem('quizHistory');
    
          const quizData = await generateMultipleChoiceQuiz({ sport, history: quizHistory ?? undefined });
          
          if (quizData.questions && quizData.questions.length > 0) {
            setQuestions(quizData.questions);
            setScore(0);
            setCurrentQuestionIndex(0);
            setUserAnswerIndex(null);
            setGameState('playing');
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron generar nuevas preguntas.' });
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

  useEffect(() => {
    if (gameState === 'answered' && feedbackRef.current) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [gameState]);

  const handleAnswer = (answerIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setSessionHistory(prev => [...prev, {
        question: currentQuestion.question,
        userAnswerIndex: answerIndex,
        correctAnswerIndex: currentQuestion.correctAnswerIndex,
        isCorrect: isCorrect,
    }]);

    setUserAnswerIndex(answerIndex);
    setGameState('answered');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswerIndex(null);
      setGameState('playing');
    } else {
      const fullHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]') as QuizHistory[];
      const updatedHistory = [...fullHistory, ...sessionHistory];
      localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
      setGameState('finished');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswerCorrect = userAnswerIndex !== null && userAnswerIndex === currentQuestion?.correctAnswerIndex;

  const getButtonVariant = (index: number) => {
    if (gameState !== 'answered') return 'outline';
    if (index === currentQuestion.correctAnswerIndex) return 'default';
    if (index === userAnswerIndex && !isAnswerCorrect) return 'destructive';
    return 'outline';
  }

  const getButtonClass = (index: number) => {
    if (gameState !== 'answered') return '';
    if (index === currentQuestion.correctAnswerIndex) return 'bg-green-600 hover:bg-green-700';
    return '';
  }


  if (gameState === 'loading') {
    return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Generando tu quiz...</p>
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
            className="w-full text-center flex flex-col items-center h-full"
        >
          <Badge className="mb-4">Pregunta {currentQuestionIndex + 1} de {questions.length}</Badge>
          <p className="text-xl md:text-2xl font-semibold mb-6 max-w-prose">{currentQuestion.question}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
            {currentQuestion.options.map((option, index) => (
                <Button 
                    key={index}
                    variant={getButtonVariant(index)}
                    className={cn("h-auto py-3 text-wrap", getButtonClass(index))}
                    onClick={() => handleAnswer(index)}
                    disabled={gameState === 'answered'}
                >
                    {option}
                </Button>
            ))}
          </div>

          {gameState === 'answered' && (
            <motion.div
              ref={feedbackRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-prose mt-6"
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
