
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';

// Define the shape of your data
type CompletedWorkout = { date: string; workout: string; duration: number; volume: number };
type DetailedWorkoutLog = { date: string; title: string; log: any[] };
type TriviaHistoryItem = { statement: string; isMyth: boolean; userAnswer: boolean; isCorrect: boolean };
type QuizHistoryItem = { question: string; userAnswerIndex: number; correctAnswerIndex: number; isCorrect: boolean };


// Define the shape of the context
interface UserDataContextType {
    loading: boolean;
    onboardingComplete: boolean | null;
    workoutRoutine: (WorkoutRoutineOutput & { sport?: string }) | null;
    completedWorkouts: CompletedWorkout[] | null;
    detailedWorkoutLogs: DetailedWorkoutLog[] | null;
    pendingFeedback: string[] | null;
    diamonds: number | null;
    triviaHistory: TriviaHistoryItem[] | null;
    quizHistory: QuizHistoryItem[] | null;

    saveWorkoutRoutine: (routine: WorkoutRoutineOutput & { sport?: string }) => void;
    addCompletedWorkout: (workout: CompletedWorkout) => void;
    addDetailedWorkoutLog: (log: DetailedWorkoutLog) => void;
    clearWorkoutProgress: () => void;
    setOnboardingComplete: (status: boolean) => void;
    
    addPendingFeedback: (exercise: string) => void;
    removePendingFeedback: (exercise: string) => void;

    setInitialDiamonds: (amount: number) => void;
    consumeDiamonds: (amount: number) => void;
    addDiamonds: (amount: number) => void;

    updateTriviaHistory: (sessionHistory: TriviaHistoryItem[]) => void;
    updateQuizHistory: (sessionHistory: QuizHistoryItem[]) => void;

    resetAllData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// Helper function to safely parse JSON from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Helper function to safely stringify and set JSON in localStorage
const saveToLocalStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const item = JSON.stringify(value);
        window.localStorage.setItem(key, item);
        // Dispatch a storage event so other tabs can update
        window.dispatchEvent(new Event('storage'));
    } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
    }
};


export const UserDataProvider = ({ children }: { children: ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [onboardingComplete, setOnboardingCompleteState] = useState<boolean | null>(null);
    const [workoutRoutine, setWorkoutRoutineState] = useState<(WorkoutRoutineOutput & { sport?: string }) | null>(null);
    const [completedWorkouts, setCompletedWorkoutsState] = useState<CompletedWorkout[] | null>(null);
    const [detailedWorkoutLogs, setDetailedWorkoutLogsState] = useState<DetailedWorkoutLog[] | null>(null);
    const [pendingFeedback, setPendingFeedbackState] = useState<string[] | null>(null);
    const [diamonds, setDiamondsState] = useState<number | null>(null);
    const [triviaHistory, setTriviaHistoryState] = useState<TriviaHistoryItem[] | null>(null);
    const [quizHistory, setQuizHistoryState] = useState<QuizHistoryItem[] | null>(null);

    // Initial load from localStorage
    useEffect(() => {
        setOnboardingCompleteState(loadFromLocalStorage('onboardingComplete', false));
        setWorkoutRoutineState(loadFromLocalStorage('workoutRoutine', null));
        setCompletedWorkoutsState(loadFromLocalStorage('completedWorkouts', []));
        setDetailedWorkoutLogsState(loadFromLocalStorage('detailedWorkoutLogs', []));
        setPendingFeedbackState(loadFromLocalStorage('pendingFeedbackExercises', []));
        setDiamondsState(loadFromLocalStorage('diamonds', 0));
        setTriviaHistoryState(loadFromLocalStorage('triviaHistory', []));
        setQuizHistoryState(loadFromLocalStorage('quizHistory', []));
        setLoading(false);
    }, []);

     // Listen for storage changes from other tabs
    useEffect(() => {
        const handleStorageChange = () => {
            setOnboardingCompleteState(loadFromLocalStorage('onboardingComplete', false));
            setWorkoutRoutineState(loadFromLocalStorage('workoutRoutine', null));
            setCompletedWorkoutsState(loadFromLocalStorage('completedWorkouts', []));
            setDetailedWorkoutLogsState(loadFromLocalStorage('detailedWorkoutLogs', []));
            setPendingFeedbackState(loadFromLocalStorage('pendingFeedbackExercises', []));
            setDiamondsState(loadFromLocalStorage('diamonds', 0));
            setTriviaHistoryState(loadFromLocalStorage('triviaHistory', []));
            setQuizHistoryState(loadFromLocalStorage('quizHistory', []));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const saveWorkoutRoutine = useCallback((routine: WorkoutRoutineOutput & { sport?: string }) => {
        setWorkoutRoutineState(routine);
        saveToLocalStorage('workoutRoutine', routine);
    }, []);

    const addCompletedWorkout = useCallback((workout: CompletedWorkout) => {
        const updated = [...(completedWorkouts ?? []), workout];
        setCompletedWorkoutsState(updated);
        saveToLocalStorage('completedWorkouts', updated);
    }, [completedWorkouts]);

    const addDetailedWorkoutLog = useCallback((log: DetailedWorkoutLog) => {
        const updated = [...(detailedWorkoutLogs ?? []), log];
        setDetailedWorkoutLogsState(updated);
        saveToLocalStorage('detailedWorkoutLogs', updated);
    }, [detailedWorkoutLogs]);

    const clearWorkoutProgress = useCallback(() => {
        setCompletedWorkoutsState([]);
        saveToLocalStorage('completedWorkouts', []);
        setDetailedWorkoutLogsState([]);
        saveToLocalStorage('detailedWorkoutLogs', []);
    }, []);
    
    const setOnboardingComplete = useCallback((status: boolean) => {
        setOnboardingCompleteState(status);
        saveToLocalStorage('onboardingComplete', status);
    }, []);

    const addPendingFeedback = useCallback((exercise: string) => {
        const updated = [...(pendingFeedback ?? []), exercise];
        setPendingFeedbackState(updated);
        saveToLocalStorage('pendingFeedbackExercises', updated);
    }, [pendingFeedback]);

    const removePendingFeedback = useCallback((exercise: string) => {
        const updated = (pendingFeedback ?? []).filter(ex => ex !== exercise);
        setPendingFeedbackState(updated);
        saveToLocalStorage('pendingFeedbackExercises', updated);
    }, [pendingFeedback]);

    const setInitialDiamonds = useCallback((amount: number) => {
        setDiamondsState(amount);
        saveToLocalStorage('diamonds', amount);
    }, []);
    
    const consumeDiamonds = useCallback((amount: number) => {
        const newDiamonds = Math.max(0, (diamonds ?? 0) - amount);
        setDiamondsState(newDiamonds);
        saveToLocalStorage('diamonds', newDiamonds);
    }, [diamonds]);

    const addDiamonds = useCallback((amount: number) => {
        const newDiamonds = (diamonds ?? 0) + amount;
        setDiamondsState(newDiamonds);
        saveToLocalStorage('diamonds', newDiamonds);
    }, [diamonds]);

    const updateTriviaHistory = useCallback((sessionHistory: TriviaHistoryItem[]) => {
        const updated = [...(triviaHistory ?? []), ...sessionHistory];
        setTriviaHistoryState(updated);
        saveToLocalStorage('triviaHistory', updated);
    }, [triviaHistory]);

    const updateQuizHistory = useCallback((sessionHistory: QuizHistoryItem[]) => {
        const updated = [...(quizHistory ?? []), ...sessionHistory];
        setQuizHistoryState(updated);
        saveToLocalStorage('quizHistory', updated);
    }, [quizHistory]);

    const resetAllData = useCallback(() => {
        const keys = [
            'onboardingComplete', 'workoutRoutine', 'completedWorkouts', 
            'detailedWorkoutLogs', 'pendingFeedbackExercises', 'diamonds',
            'triviaHistory', 'quizHistory', 'hasSeenOnboardingTour'
        ];
        keys.forEach(key => localStorage.removeItem(key));
        
        setOnboardingCompleteState(false);
        setWorkoutRoutineState(null);
        setCompletedWorkoutsState([]);
        setDetailedWorkoutLogsState([]);
        setPendingFeedbackState([]);
        setDiamondsState(0);
        setTriviaHistoryState([]);
        setQuizHistoryState([]);
    }, []);


    const value = {
        loading,
        onboardingComplete,
        workoutRoutine,
        completedWorkouts,
        detailedWorkoutLogs,
        pendingFeedback,
        diamonds,
        triviaHistory,
        quizHistory,
        saveWorkoutRoutine,
        addCompletedWorkout,
        addDetailedWorkoutLog,
        clearWorkoutProgress,
        setOnboardingComplete,
        addPendingFeedback,
        removePendingFeedback,
        setInitialDiamonds,
        consumeDiamonds,
        addDiamonds,
        updateTriviaHistory,
        updateQuizHistory,
        resetAllData,
    };

    return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};

export const useUserData = (): UserDataContextType => {
    const context = useContext(UserDataContext);
    if (context === undefined) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
};

    
