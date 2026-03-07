export interface WorkoutSession {
  id: string;
  day_tag: string;
  day_name: string;
  date: string;
  is_complete: boolean;
  week_number: number;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  workout_id: string;
  exercise_name: string;
  display_order: number;
  category: string;
}

export interface SetLog {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  is_complete: boolean;
}

export interface ExerciseLogWithSets extends ExerciseLog {
  set_logs: SetLog[];
}

export interface WorkoutSessionFull extends WorkoutSession {
  exercise_logs: ExerciseLogWithSets[];
}
