
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, limit, writeBatch, serverTimestamp, deleteDoc, getDocFromCache, onSnapshot } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import { isToday, isYesterday, parseISO, startOfWeek } from 'date-fns';
import { useToast } from './use-toast';
import { useI18n } from '@/i18n/client';
import { weeklyMissions, type Mission, type MissionProgress } from '@/lib/missions';

export type UserProfile = {
    uid: string;
    displayName: string;
    photoURL: string;
    xp: number;
    lastLogin: any; // Using serverTimestamp
};
type CompletedWorkout = { date: string; workout: string; duration: number; volume: number };
type DetailedWorkoutLog = { date: string; title: string; log: any[] };
type TriviaHistoryItem = { statement: string; isMyth: boolean; userAnswer: boolean; isCorrect: boolean };
type QuizHistoryItem = { question: string; userAnswerIndex: number; correctAnswerIndex: number; isCorrect: boolean };
type WeeklyMissionData = {
    weekId: string;
    progress: Record<string, MissionProgress>;
};

// This represents all the data we want to store in Firestore for a user.
export type UserFirestoreData = {
    onboardingComplete: boolean;
    workoutRoutine: (WorkoutRoutineOutput & { sport?: string }) | null;
    completedWorkouts: CompletedWorkout[];
    detailedWorkoutLogs: DetailedWorkoutLog[];
    pendingFeedback: string[];
    diamonds: number;
    xp: number;
    streak: number;
    lastWorkoutDate: string | null;
    triviaHistory: TriviaHistoryItem[];
    quizHistory: QuizHistoryItem[];
    missionData: WeeklyMissionData | null;
};

interface UserDataContextType {
    loading: boolean;
    onboardingComplete: boolean | null;
    workoutRoutine: (WorkoutRoutineOutput & { sport?: string }) | null;
    completedWorkouts: CompletedWorkout[] | null;
    detailedWorkoutLogs: DetailedWorkoutLog[] | null;
    pendingFeedback: string[] | null;
    diamonds: number | null;
    xp: number | null;
    streak: number | null;
    triviaHistory: TriviaHistoryItem[] | null;
    quizHistory: QuizHistoryItem[] | null;
    missionData: WeeklyMissionData | null;
    
    getLeaderboard: (uid: string) => Promise<{topUsers: UserProfile[], currentUserData: UserProfile | null, currentUserRank: number | null}>;
    
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
    addXP: (amount: number, bonusReason?: string) => Promise<void>;

    updateTriviaHistory: (sessionHistory: TriviaHistoryItem[]) => void;
    updateQuizHistory: (sessionHistory: QuizHistoryItem[]) => void;

    resetAllData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);

    // State mirroring UserFirestoreData
    const [onboardingComplete, setOnboardingCompleteState] = useState<boolean | null>(null);
    const [workoutRoutine, setWorkoutRoutineState] = useState<(WorkoutRoutineOutput & { sport?: string }) | null>(null);
    const [completedWorkouts, setCompletedWorkoutsState] = useState<CompletedWorkout[] | null>(null);
    const [detailedWorkoutLogs, setDetailedWorkoutLogsState] = useState<DetailedWorkoutLog[] | null>(null);
    const [pendingFeedback, setPendingFeedbackState] = useState<string[] | null>(null);
    const [diamonds, setDiamondsState] = useState<number | null>(null);
    const [xp, setXpState] = useState<number | null>(null);
    const [streak, setStreakState] = useState<number | null>(null);
    const [lastWorkoutDate, setLastWorkoutDateState] = useState<string | null>(null);
    const [triviaHistory, setTriviaHistoryState] = useState<TriviaHistoryItem[] | null>(null);
    const [quizHistory, setQuizHistoryState] = useState<QuizHistoryItem[] | null>(null);
    const [missionData, setMissionDataState] = useState<WeeklyMissionData | null>(null);
    
    const setStateFromData = useCallback((data: Partial<UserFirestoreData> | null) => {
        const onboarding = data?.onboardingComplete ?? false;
        setOnboardingCompleteState(onboarding);
        setWorkoutRoutineState(data?.workoutRoutine ?? null);
        setCompletedWorkoutsState(data?.completedWorkouts ?? []);
        setDetailedWorkoutLogsState(data?.detailedWorkoutLogs ?? []);
        setPendingFeedbackState(data?.pendingFeedback ?? []);
        setDiamondsState(data?.diamonds ?? 0);
        setXpState(data?.xp ?? 0);
        setStreakState(data?.streak ?? 0);
        setLastWorkoutDateState(data?.lastWorkoutDate ?? null);
        setTriviaHistoryState(data?.triviaHistory ?? []);
        setQuizHistoryState(data?.quizHistory ?? []);

        const currentWeekId = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
        if (data?.missionData && data.missionData.weekId === currentWeekId) {
            setMissionDataState(data.missionData);
        } else if(onboarding) { // Only reset if onboarding is complete
            const newMissionData = {
                weekId: currentWeekId,
                progress: Object.fromEntries(weeklyMissions.map(m => [m.id, { current: 0, completed: false }]))
            };
            setMissionDataState(newMissionData);
            if (user) {
                updateDoc(doc(db, 'usersData', user.uid), { missionData: newMissionData }).catch(console.error);
            }
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }

        if (!user) {
            setStateFromData(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const userRef = doc(db, 'usersData', user.uid);

        const unsubscribe = onSnapshot(userRef, 
            (docSnap) => {
                if (docSnap.exists()) {
                    setStateFromData(docSnap.data() as UserFirestoreData);
                } else {
                    // This case handles a brand new user. We create their documents.
                    const userProfileRef = doc(db, 'users', user.uid);
                    const userProfileData: UserProfile = {
                        uid: user.uid,
                        displayName: user.displayName!,
                        photoURL: user.photoURL!,
                        xp: 0,
                        lastLogin: serverTimestamp(),
                    };
                    const newUserData: UserFirestoreData = {
                        onboardingComplete: false, workoutRoutine: null, completedWorkouts: [],
                        detailedWorkoutLogs: [], pendingFeedback: [], diamonds: 0, xp: 0, streak: 0,
                        lastWorkoutDate: null, triviaHistory: [], quizHistory: [], missionData: null
                    };
                    const batch = writeBatch(db);
                    batch.set(userProfileRef, userProfileData);
                    batch.set(userRef, newUserData);
                    batch.commit().catch(console.error);
                    setStateFromData(newUserData);
                }
                setLoading(false);
            }, 
            (error) => {
                console.error("Error with Firestore snapshot listener:", error);
                toast({ variant: 'destructive', title: "Error de Conexión", description: "No se pudo sincronizar con el servidor." });
                setLoading(false);
            }
        );

        // Cleanup the listener when the component unmounts or user changes
        return () => unsubscribe();

    }, [user, authLoading, setStateFromData, toast]);


    const addXP = useCallback(async (amount: number, bonusReason?: string) => {
        if (xp === null) return;
        const streakBonus = streak ? streak * 10 : 0;
        let totalAmount = amount + streakBonus;
        
        const newXP = xp + totalAmount;
        setXpState(newXP);

        let description = `+${amount} XP`;
        if (streakBonus > 0) {
            description += ` + ${streakBonus} XP (${t('toast.streakBonus')})`;
        }
         if (bonusReason) {
            description += ` (${bonusReason})`;
        }

        toast({
            title: t('toast.xpGained'),
            description: description
        });

        if (user) {
            try {
                const userProfileRef = doc(db, 'users', user.uid);
                const userDataRef = doc(db, 'usersData', user.uid);
                const batch = writeBatch(db);
                batch.update(userProfileRef, { xp: newXP, lastLogin: serverTimestamp() });
                batch.update(userDataRef, { xp: newXP });
                await batch.commit();
            } catch (error) {
                console.error("Error updating XP in Firestore:", error);
            }
        }
    }, [xp, streak, user, toast, t]);

    const updateMissionProgress = useCallback(async (newlyCompletedWorkout: CompletedWorkout, currentStreakValue: number) => {
        if (!missionData) return;

        const newProgress = { ...missionData.progress };

        weeklyMissions.forEach(mission => {
            if (newProgress[mission.id]?.completed) return;

            let missionUpdated = false;
            let currentValue = newProgress[mission.id]?.current ?? 0;
            
            switch (mission.type) {
                case 'workoutsCompleted': currentValue += 1; missionUpdated = true; break;
                case 'totalVolume': currentValue += newlyCompletedWorkout.volume; missionUpdated = true; break;
                case 'streak': currentValue = Math.max(currentValue, currentStreakValue); missionUpdated = true; break;
            }

            if (missionUpdated) {
                newProgress[mission.id] = { ...newProgress[mission.id], current: currentValue };
                if (currentValue >= mission.goal) {
                    newProgress[mission.id].completed = true;
                    addXP(mission.xpReward, t('missions.rewardReason', { mission: t(`missions.missions.${mission.id}.title`) }));
                }
            }
        });
        
        const newMissionData = { ...missionData, progress: newProgress };
        setMissionDataState(newMissionData);
        if (user) {
          updateDoc(doc(db, 'usersData', user.uid), { missionData: newMissionData }).catch(console.error);
        }
    }, [missionData, addXP, t, user]);

    const addCompletedWorkout = useCallback(async (workout: CompletedWorkout) => {
        if (completedWorkouts === null || streak === null) return;
        const updated = [...completedWorkouts, workout];

        const today = new Date();
        let currentStreakValue = streak;
        
        if (lastWorkoutDate) {
            const lastDate = parseISO(lastWorkoutDate);
            if (isYesterday(lastDate)) {
                currentStreakValue++;
            } else if (!isToday(lastDate)) {
                currentStreakValue = 1;
            }
        } else {
            currentStreakValue = 1;
        }
        
        const newLastWorkoutDate = today.toISOString();
        
        // Optimistically update local state for immediate UI response
        setCompletedWorkoutsState(updated);
        setStreakState(currentStreakValue);
        setLastWorkoutDateState(newLastWorkoutDate);

        if (user) {
            updateDoc(doc(db, 'usersData', user.uid), { 
                completedWorkouts: updated,
                streak: currentStreakValue,
                lastWorkoutDate: newLastWorkoutDate
             }).catch(console.error);
        }

        updateMissionProgress(workout, currentStreakValue);

    }, [completedWorkouts, streak, lastWorkoutDate, user, updateMissionProgress]);

    const saveData = useCallback(async (key: keyof UserFirestoreData, value: any) => {
        if (user) {
            updateDoc(doc(db, 'usersData', user.uid), { [key]: value }).catch(console.error);
        }
    }, [user]);

    const saveWorkoutRoutine = useCallback((routine: WorkoutRoutineOutput & { sport?: string }) => {
        setWorkoutRoutineState(routine);
        saveData('workoutRoutine', routine);
    }, [saveData]);

    const addDetailedWorkoutLog = useCallback((log: DetailedWorkoutLog) => {
        if (detailedWorkoutLogs === null) return;
        const updated = [...detailedWorkoutLogs, log];
        setDetailedWorkoutLogsState(updated);
        saveData('detailedWorkoutLogs', updated);
    }, [detailedWorkoutLogs, saveData]);

    const clearWorkoutProgress = useCallback(() => {
        setCompletedWorkoutsState([]);
        saveData('completedWorkouts', []);
        setDetailedWorkoutLogsState([]);
        saveData('detailedWorkoutLogs', []);
    }, [saveData]);
    
    const setOnboardingComplete = useCallback(async (status: boolean) => {
        setOnboardingCompleteState(status);
        if (user) {
            const userRef = doc(db, 'usersData', user.uid);
            updateDoc(userRef, { onboardingComplete: status });
        }
    }, [user]);

    const addPendingFeedback = useCallback((exercise: string) => {
        if (pendingFeedback === null) return;
        const updated = [...pendingFeedback, exercise];
        setPendingFeedbackState(updated);
        saveData('pendingFeedback', updated);
    }, [pendingFeedback, saveData]);

    const removePendingFeedback = useCallback((exercise: string) => {
        if (pendingFeedback === null) return;
        const updated = pendingFeedback.filter(ex => ex !== exercise);
        setPendingFeedbackState(updated);
        saveData('pendingFeedback', updated);
    }, [pendingFeedback, saveData]);

    const setInitialDiamonds = useCallback((amount: number) => {
        setDiamondsState(amount);
        saveData('diamonds', amount);
    }, [saveData]);
    
    const consumeDiamonds = useCallback((amount: number) => {
        if (diamonds === null) return;
        const newDiamonds = Math.max(0, diamonds - amount);
        setDiamondsState(newDiamonds);
        saveData('diamonds', newDiamonds);
    }, [diamonds, saveData]);

    const addDiamonds = useCallback((amount: number) => {
        if (diamonds === null) return;
        const newDiamonds = diamonds + amount;
        setDiamondsState(newDiamonds);
        saveData('diamonds', newDiamonds);
    }, [diamonds, saveData]);
    
    const updateTriviaHistory = useCallback((sessionHistory: TriviaHistoryItem[]) => {
        if (triviaHistory === null) return;
        const updated = [...triviaHistory, ...sessionHistory];
        setTriviaHistoryState(updated);
        saveData('triviaHistory', updated);
    }, [triviaHistory, saveData]);

    const updateQuizHistory = useCallback((sessionHistory: QuizHistoryItem[]) => {
        if (quizHistory === null) return;
        const updated = [...quizHistory, ...sessionHistory];
        setQuizHistoryState(updated);
        saveData('quizHistory', updated);
    }, [quizHistory, saveData]);
    
    const getLeaderboard = useCallback(async (uid: string) => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('xp', 'desc'), limit(10));
            const querySnapshot = await getDocs(q);
            const topUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);

            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const currentUserData = userSnap.exists() ? userSnap.data() as UserProfile : null;
            
            const allUsersSnapshot = await getDocs(query(usersRef, orderBy('xp', 'desc')));
            const currentUserRank = allUsersSnapshot.docs.findIndex(doc => doc.id === uid) + 1;

            return { topUsers, currentUserData, currentUserRank: currentUserRank > 0 ? currentUserRank : null };

        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return { topUsers: [], currentUserData: null, currentUserRank: null };
        } finally {
            setLoading(false);
        }
    }, []);
    
    const resetAllData = useCallback(async () => {
        if (user) {
            try {
                // We delete the documents, and the onSnapshot listener will
                // see that they don't exist and reset the state to default.
                const batch = writeBatch(db);
                batch.delete(doc(db, 'users', user.uid));
                batch.delete(doc(db, 'usersData', user.uid));
                await batch.commit();
            } catch (error) {
                console.error("Error resetting all user data in Firestore:", error);
            }
        } else {
            // If no user, just reset local state
            setStateFromData(null);
        }
    }, [user, setStateFromData]);

    const value: UserDataContextType = {
        loading: loading || authLoading, onboardingComplete, workoutRoutine, completedWorkouts,
        detailedWorkoutLogs, pendingFeedback, diamonds, xp, streak,
        triviaHistory, quizHistory, missionData, getLeaderboard,
        saveWorkoutRoutine,
        addCompletedWorkout, addDetailedWorkoutLog, clearWorkoutProgress,
        setOnboardingComplete, addPendingFeedback, removePendingFeedback,
        setInitialDiamonds, consumeDiamonds, addDiamonds, addXP,
        updateTriviaHistory, updateQuizHistory, resetAllData,
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
