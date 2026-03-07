export type ExerciseCategory = 'primaryPush' | 'primaryPull' | 'maintenance' | 'accessory';
export type ExerciseEquipment = 'barbell' | 'kettlebell' | 'bodyweight';

export interface SetDefinition {
  setNumber: number;
  targetReps: number;
  targetRpe?: number;
}

export interface ExerciseDefinition {
  name: string;
  category: ExerciseCategory;
  equipment: ExerciseEquipment;
  sets: SetDefinition[];
  repRange: string;
  increment?: number; // lbs to add per session on success; undefined = accessory (no auto progression)
}

export interface ProgramDay {
  tag: 'dayA' | 'dayB' | 'dayC';
  name: string;
  exercises: ExerciseDefinition[];
}

function makeSets(count: number, targetReps: number, targetRpe?: number): SetDefinition[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    targetReps,
    targetRpe,
  }));
}

export const PROGRAM: ProgramDay[] = [
  {
    tag: 'dayA',
    name: 'Day A — Upper Push Priority',
    exercises: [
      {
        name: 'Barbell Bench Press',
        category: 'primaryPush',
        equipment: 'barbell',
        sets: makeSets(5, 5, 7.5),
        repRange: '5',
        increment: 5,
      },
      {
        name: 'Overhead Press',
        category: 'primaryPush',
        equipment: 'barbell',
        sets: makeSets(5, 5, 7.5),
        repRange: '5',
        increment: 2.5,
      },
      {
        name: 'Barbell Row (Pendlay)',
        category: 'primaryPull',
        equipment: 'barbell',
        sets: makeSets(5, 5, 7.5),
        repRange: '5',
        increment: 2.5,
      },
      {
        name: 'Close-Grip Bench Press',
        category: 'accessory',
        equipment: 'barbell',
        sets: makeSets(3, 8, 7),
        repRange: '8',
      },
      {
        name: 'KB Halo',
        category: 'maintenance',
        equipment: 'kettlebell',
        sets: makeSets(3, 10, 6),
        repRange: '10 ea.',
      },
      {
        name: 'KB Single-Arm Row',
        category: 'maintenance',
        equipment: 'kettlebell',
        sets: makeSets(3, 10, 6.5),
        repRange: '10 ea.',
      },
    ],
  },
  {
    tag: 'dayB',
    name: 'Day B — Lower + Accessory Pull',
    exercises: [
      {
        name: 'Back Squat',
        category: 'maintenance',
        equipment: 'barbell',
        sets: makeSets(3, 5, 7),
        repRange: '5',
      },
      {
        name: 'Romanian Deadlift',
        category: 'maintenance',
        equipment: 'barbell',
        sets: makeSets(3, 8, 7),
        repRange: '8',
      },
      {
        name: 'Pull-Up',
        category: 'primaryPull',
        equipment: 'bodyweight',
        sets: makeSets(4, 5, 7.5),
        repRange: 'max',
        increment: 0,
      },
      {
        name: 'Underhand Barbell Row',
        category: 'maintenance',
        equipment: 'barbell',
        sets: makeSets(3, 8, 7),
        repRange: '8',
      },
      {
        name: 'KB Swing',
        category: 'accessory',
        equipment: 'kettlebell',
        sets: makeSets(3, 15, 7),
        repRange: '15',
      },
      {
        name: 'Barbell Curl',
        category: 'accessory',
        equipment: 'barbell',
        sets: makeSets(3, 10, 6),
        repRange: '10',
      },
    ],
  },
  {
    tag: 'dayC',
    name: 'Day C — Upper Pull + Deadlift',
    exercises: [
      {
        name: 'Conventional Deadlift',
        category: 'maintenance',
        equipment: 'barbell',
        sets: makeSets(1, 5, 7),
        repRange: '5',
      },
      {
        name: 'Weighted Pull-Up',
        category: 'primaryPull',
        equipment: 'bodyweight',
        sets: makeSets(5, 5, 7.5),
        repRange: '5',
        increment: 5,
      },
      {
        name: 'Barbell Row',
        category: 'primaryPull',
        equipment: 'barbell',
        sets: makeSets(4, 6, 8),
        repRange: '6',
        increment: 5,
      },
      {
        name: 'Seated KB Lateral Raise',
        category: 'accessory',
        equipment: 'kettlebell',
        sets: makeSets(4, 12, 7),
        repRange: '12–15',
      },
      {
        name: 'KB Turkish Get-Up',
        category: 'accessory',
        equipment: 'kettlebell',
        sets: makeSets(2, 3, 6),
        repRange: '3 ea.',
      },
      {
        name: 'KB Halo',
        category: 'maintenance',
        equipment: 'kettlebell',
        sets: makeSets(2, 10, 5),
        repRange: '10 ea.',
      },
    ],
  },
];

export const startingWeights: Record<string, number> = {
  'Barbell Bench Press': 165,
  'Overhead Press': 115,
  'Barbell Row (Pendlay)': 135,
  'Close-Grip Bench Press': 135,
  'KB Halo': 26,
  'KB Single-Arm Row': 35,
  'Back Squat': 265,
  'Romanian Deadlift': 185,
  'Pull-Up': 0,
  'Underhand Barbell Row': 115,
  'KB Swing': 53,
  'Barbell Curl': 65,
  'Conventional Deadlift': 295,
  'Weighted Pull-Up': 0,
  'Barbell Row': 155,
  'Seated KB Lateral Raise': 20,
  'KB Turkish Get-Up': 26,
};

export function getNextDay(lastDayTag?: string | null): ProgramDay {
  if (!lastDayTag) return PROGRAM[0];
  const idx = PROGRAM.findIndex((d) => d.tag === lastDayTag);
  return PROGRAM[(idx + 1) % PROGRAM.length];
}

export function getDayByTag(tag: string): ProgramDay | undefined {
  return PROGRAM.find((d) => d.tag === tag);
}

export function calculateWeekNumber(firstSessionDate: string | null): number {
  if (!firstSessionDate) return 1;
  const first = new Date(firstSessionDate).getTime();
  const now = Date.now();
  const weeks = Math.floor((now - first) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(weeks + 1, 12);
}

export const categoryLabel: Record<ExerciseCategory, string> = {
  primaryPush: 'Push',
  primaryPull: 'Pull',
  maintenance: 'Maint',
  accessory: 'Acc',
};

export const categoryColor: Record<ExerciseCategory, string> = {
  primaryPush: 'bg-violet-900 text-violet-300',
  primaryPull: 'bg-blue-900 text-blue-300',
  maintenance: 'bg-zinc-800 text-zinc-400',
  accessory: 'bg-zinc-800 text-zinc-500',
};

export const equipmentLabel: Record<ExerciseEquipment, string> = {
  barbell: 'Barbell',
  kettlebell: 'Kettlebell',
  bodyweight: 'Bodyweight',
};
