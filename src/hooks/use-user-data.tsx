
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { WorkoutRoutineOutput } from '@/ai/flows/types';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, limit, writeBatch, serverTimestamp } from 'firebase/firestore'; 
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
    syncLocalToFirestore: (uid: string) => Promise<void>;
    loadDataFromFirestore: (uid: string) => Promise<void>;
    
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

// Helper function to safely parse JSON from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToLocalStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    try {
        const item = JSON.stringify(value);
        window.localStorage.setItem(key, item);
        window.dispatchEvent(new Event('storage'));
    } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
    }
};

const keys: Array<keyof UserFirestoreData> = [
    'onboardingComplete', 'workoutRoutine', 'completedWorkouts', 
    'detailedWorkoutLogs', 'pendingFeedback', 'diamonds', 'xp',
    'streak', 'lastWorkoutDate', 'triviaHistory', 'quizHistory', 'missionData'
];

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { t } = useI18n();
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // State mirroring UserFirestoreData
    const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(false);
    const [workoutRoutine, setWorkoutRoutineState] = useState<(WorkoutRoutineOutput & { sport?: string }) | null>(null);
    const [completedWorkouts, setCompletedWorkoutsState] = useState<CompletedWorkout[]>([]);
    const [detailedWorkoutLogs, setDetailedWorkoutLogsState] = useState<DetailedWorkoutLog[]>([]);
    const [pendingFeedback, setPendingFeedbackState] = useState<string[]>([]);
    const [diamonds, setDiamondsState] = useState<number>(0);
    const [xp, setXpState] = useState<number>(0);
    const [streak, setStreakState] = useState<number>(0);
    const [lastWorkoutDate, setLastWorkoutDateState] = useState<string | null>(null);
    const [triviaHistory, setTriviaHistoryState] = useState<TriviaHistoryItem[]>([]);
    const [quizHistory, setQuizHistoryState] = useState<QuizHistoryItem[]>([]);
    const [missionData, setMissionDataState] = useState<WeeklyMissionData | null>(null);

    const resetAllData = useCallback(() => {
        keys.forEach(key => localStorage.removeItem(key));
        const emptyData = {
            onboardingComplete: false, workoutRoutine: null, completedWorkouts: [],
            detailedWorkoutLogs: [], pendingFeedback: [], diamonds: 0, xp: 0, streak: 0,
            lastWorkoutDate: null, triviaHistory: [], quizHistory: [], missionData: null
        };
        setStateFromData(emptyData);
    }, []);

    const setStateFromData = useCallback((data: Partial<UserFirestoreData>) => {
        if (data.onboardingComplete !== undefined) setOnboardingCompleteState(data.onboardingComplete);
        if (data.workoutRoutine !== undefined) setWorkoutRoutineState(data.workoutRoutine);
        if (data.completedWorkouts !== undefined) setCompletedWorkoutsState(data.completedWorkouts);
        if (data.detailedWorkoutLogs !== undefined) setDetailedWorkoutLogsState(data.detailedWorkoutLogs);
        if (data.pendingFeedback !== undefined) setPendingFeedbackState(data.pendingFeedback);
        if (data.diamonds !== undefined) setDiamondsState(data.diamonds);
        if (data.xp !== undefined) setXpState(data.xp);
        if (data.streak !== undefined) setStreakState(data.streak);
        if (data.lastWorkoutDate !== undefined) setLastWorkoutDateState(data.lastWorkoutDate);
        if (data.triviaHistory !== undefined) setTriviaHistoryState(data.triviaHistory);
        if (data.quizHistory !== undefined) setQuizHistoryState(data.quizHistory);

        // Mission data check
        const currentWeekId = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
        if (data.missionData && data.missionData.weekId === currentWeekId) {
            setMissionDataState(data.missionData);
        } else {
            const newMissionData = {
                weekId: currentWeekId,
                progress: Object.fromEntries(weeklyMissions.map(m => [m.id, { current: 0, completed: false }]))
            };
            setMissionDataState(newMissionData);
            saveToLocalStorage('missionData', newMissionData);
        }
    }, []);

    const syncLocalToFirestore = useCallback(async (uid: string) => {
        if (!uid || isSyncing) return;
        setIsSyncing(true);
        const dataToSync: UserFirestoreData = {
            onboardingComplete: loadFromLocalStorage('onboardingComplete', false),
            workoutRoutine: loadFromLocalStorage('workoutRoutine', null),
            completedWorkouts: loadFromLocalStorage('completedWorkouts', []),
            detailedWorkoutLogs: loadFromLocalStorage('detailedWorkoutLogs', []),
            pendingFeedback: loadFromLocalStorage('pendingFeedback', []),
            diamonds: loadFromLocalStorage('diamonds', 0),
            xp: loadFromLocalStorage('xp', 0),
            streak: loadFromLocalStorage('streak', 0),
            lastWorkoutDate: loadFromLocalStorage('lastWorkoutDate', null),
            triviaHistory: loadFromLocalStorage('triviaHistory', []),
            quizHistory: loadFromLocalStorage('quizHistory', []),
            missionData: loadFromLocalStorage('missionData', null),
        };
        
        try {
            const userRef = doc(db, 'usersData', uid);
            await setDoc(userRef, dataToSync, { merge: true });

            const userProfileRef = doc(db, 'users', uid);
            const userProfileSnap = await getDoc(userProfileRef);
            const userProfileData: Partial<UserProfile> = {
                uid: user!.uid,
                displayName: user!.displayName!,
                photoURL: user!.photoURL!,
                xp: dataToSync.xp,
                lastLogin: serverTimestamp(),
            };

            if (userProfileSnap.exists()) {
                await updateDoc(userProfileRef, userProfileData);
            } else {
                await setDoc(userProfileRef, userProfileData);
            }

        } catch (error) {
            console.error("Error syncing local data to Firestore:", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, user]);

    const loadDataFromFirestore = useCallback(async (uid: string) => {
        if (!uid || isSyncing) return;
        setLoading(true);
        setIsSyncing(true);
        try {
            const userRef = doc(db, 'usersData', uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const firestoreData = docSnap.data() as UserFirestoreData;
                setStateFromData(firestoreData);
                keys.forEach(key => {
                    saveToLocalStorage(key, firestoreData[key] ?? null);
                });
            } else {
                await syncLocalToFirestore(uid);
            }
        } catch (error) {
            console.error("Error loading data from Firestore:", error);
        } finally {
            setLoading(false);
            setIsSyncing(false);
        }
    }, [isSyncing, setStateFromData, syncLocalToFirestore]);
    
     useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }

        if (user) {
            if (user.isAnonymous) {
                // For anonymous users, load from local storage
                const localData: Partial<UserFirestoreData> = {};
                keys.forEach(key => {
                    localData[key] = loadFromLocalStorage(key, null);
                });
                setStateFromData(localData);
                setLoading(false);
            } else {
                // For real users, load from Firestore
                loadDataFromFirestore(user.uid);
            }
        } else {
            // No user at all, reset to default state
            resetAllData();
            setLoading(false);
        }
    }, [user, authLoading, loadDataFromFirestore, setStateFromData, resetAllData]);
    
     // Listen for storage changes from other tabs
    useEffect(() => {
        const handleStorageChange = () => {
            const localData: Partial<UserFirestoreData> = {};
            keys.forEach(key => {
                localData[key] = loadFromLocalStorage(key, null);
            });
            setStateFromData(localData);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [setStateFromData]);


    const addXP = useCallback(async (amount: number, bonusReason?: string) => {
        let totalAmount = amount;
        const newXP = xp + totalAmount;
        setXpState(newXP);
        saveToLocalStorage('xp', newXP);

        let description = `+${amount} XP`;
        if (bonusReason) {
            description = `+${amount} XP (${bonusReason})`;
        }

        toast({
            title: t('toast.xpGained'),
            description: description
        });

        if (user && !user.isAnonymous) {
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
    }, [xp, user, toast, t]);

    const updateMissionProgress = useCallback((newlyCompletedWorkout: CompletedWorkout, currentStreakValue: number) => {
        const currentData = missionData ?? {
            weekId: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0],
            progress: Object.fromEntries(weeklyMissions.map(m => [m.id, { current: 0, completed: false }]))
        };

        const newProgress = { ...currentData.progress };

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
        
        const newMissionData = { ...currentData, progress: newProgress };
        setMissionDataState(newMissionData);
        saveToLocalStorage('missionData', newMissionData);
    }, [missionData, addXP, t]);

    const addCompletedWorkout = useCallback((workout: CompletedWorkout) => {
        const updated = [...completedWorkouts, workout];
        setCompletedWorkoutsState(updated);
        saveToLocalStorage('completedWorkouts', updated);

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
        
        setStreakState(currentStreakValue);
        saveToLocalStorage('streak', currentStreakValue);
        const newLastWorkoutDate = today.toISOString();
        setLastWorkoutDateState(newLastWorkoutDate);
        saveToLocalStorage('lastWorkoutDate', newLastWorkoutDate);

        updateMissionProgress(workout, currentStreakValue);

    }, [completedWorkouts, streak, lastWorkoutDate, updateMissionProgress]);

    const saveData = useCallback((key: keyof UserFirestoreData, value: any) => {
        saveToLocalStorage(key, value);
        if (user && !user.isAnonymous) {
            updateDoc(doc(db, 'usersData', user.uid), { [key]: value }).catch(console.error);
        }
    }, [user]);

    const saveWorkoutRoutine = useCallback((routine: WorkoutRoutineOutput & { sport?: string }) => {
        setWorkoutRoutineState(routine);
        saveData('workoutRoutine', routine);
    }, [saveData]);

    const addDetailedWorkoutLog = useCallback((log: DetailedWorkoutLog) => {
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
    
    const setOnboardingComplete = useCallback((status: boolean) => {
        setOnboardingCompleteState(status);
        saveData('onboardingComplete', status);
    }, [saveData]);

    const addPendingFeedback = useCallback((exercise: string) => {
        const updated = [...pendingFeedback, exercise];
        setPendingFeedbackState(updated);
        saveData('pendingFeedback', updated);
    }, [pendingFeedback, saveData]);

    const removePendingFeedback = useCallback((exercise: string) => {
        const updated = pendingFeedback.filter(ex => ex !== exercise);
        setPendingFeedbackState(updated);
        saveData('pendingFeedback', updated);
    }, [pendingFeedback, saveData]);

    const setInitialDiamonds = useCallback((amount: number) => {
        setDiamondsState(amount);
        saveData('diamonds', amount);
    }, [saveData]);
    
    const consumeDiamonds = useCallback((amount: number) => {
        const newDiamonds = Math.max(0, diamonds - amount);
        setDiamondsState(newDiamonds);
        saveData('diamonds', newDiamonds);
    }, [diamonds, saveData]);

    const addDiamonds = useCallback((amount: number) => {
        const newDiamonds = diamonds + amount;
        setDiamondsState(newDiamonds);
        saveData('diamonds', newDiamonds);
    }, [diamonds, saveData]);
    
    const updateTriviaHistory = useCallback((sessionHistory: TriviaHistoryItem[]) => {
        const updated = [...triviaHistory, ...sessionHistory];
        setTriviaHistoryState(updated);
        saveData('triviaHistory', updated);
    }, [triviaHistory, saveData]);

    const updateQuizHistory = useCallback((sessionHistory: QuizHistoryItem[]) => {
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

    const value: UserDataContextType = {
        loading: loading || authLoading, onboardingComplete, workoutRoutine, completedWorkouts,
        detailedWorkoutLogs, pendingFeedback, diamonds, xp, streak,
        triviaHistory, quizHistory, missionData, getLeaderboard,
        syncLocalToFirestore, loadDataFromFirestore, saveWorkoutRoutine,
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
