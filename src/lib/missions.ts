
export type Mission = {
    id: 'complete_3_workouts' | 'complete_5_workouts' | 'lift_10000_kg' | 'reach_3_day_streak';
    type: 'workoutsCompleted' | 'totalVolume' | 'streak';
    goal: number;
    xpReward: number;
};

export type MissionProgress = {
    current: number;
    completed: boolean;
};

export const weeklyMissions: Mission[] = [
    {
        id: 'complete_3_workouts',
        type: 'workoutsCompleted',
        goal: 3,
        xpReward: 100,
    },
    {
        id: 'complete_5_workouts',
        type: 'workoutsCompleted',
        goal: 5,
        xpReward: 250,
    },
    {
        id: 'lift_10000_kg',
        type: 'totalVolume',
        goal: 10000,
        xpReward: 150,
    },
    {
        id: 'reach_3_day_streak',
        type: 'streak',
        goal: 3,
        xpReward: 75,
    },
];
