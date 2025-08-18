export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sport: string;
  description: string;
  videoUrl: string;
  imageUrl: string;
};

export const exercises: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Squat',
    muscleGroup: 'Legs',
    sport: 'Weightlifting',
    description: 'A fundamental compound exercise that targets the quadriceps, hamstrings, glutes, and core. Essential for building lower body strength and power.',
    videoUrl: 'https://www.youtube.com/watch?v=U3h99fayM6E',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '2',
    name: 'Box Jump',
    muscleGroup: 'Legs',
    sport: 'Basketball',
    description: 'A plyometric exercise that develops explosive power in the legs. Crucial for improving vertical jump and athletic performance.',
    videoUrl: 'https://www.youtube.com/watch?v=B322k_Q12_0',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '3',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    sport: 'Powerlifting',
    description: 'A core upper body exercise that targets the pectoralis major, anterior deltoids, and triceps. Key for building upper body strength.',
    videoUrl: 'https://www.youtube.com/watch?v=rT7g-Nzl0Yk',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '4',
    name: 'Pull Up',
    muscleGroup: 'Back',
    sport: 'Calisthenics',
    description: 'A challenging bodyweight exercise that strengthens the latissimus dorsi, biceps, and traps. Excellent for developing a strong back and grip.',
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '5',
    name: 'Kettlebell Swing',
    muscleGroup: 'Full Body',
    sport: 'CrossFit',
    description: 'A dynamic, high-intensity exercise that builds power, endurance, and strength throughout the posterior chain.',
    videoUrl: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '6',
    name: 'Plank',
    muscleGroup: 'Core',
    sport: 'General Fitness',
    description: 'An isometric core strength exercise that involves maintaining a position similar to a push-up for the maximum possible time.',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '7',
    name: 'Deadlift',
    muscleGroup: 'Full Body',
    sport: 'Weightlifting',
    description: 'The ultimate test of total-body strength, the deadlift works your entire posterior chain from your calves to your upper back.',
    videoUrl: 'https://www.youtube.com/watch?v=ytGaGIn3SjE',
    imageUrl: 'https://placehold.co/600x400',
  },
  {
    id: '8',
    name: 'Sprints',
    muscleGroup: 'Legs',
    sport: 'Soccer',
    description: 'Short bursts of maximum effort running, essential for improving speed, acceleration, and anaerobic fitness in field sports.',
    videoUrl: 'https://www.youtube.com/watch?v=b_3s_n89-mo',
    imageUrl: 'https://placehold.co/600x400',
  },
];
