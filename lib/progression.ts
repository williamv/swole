import { supabase } from './supabase';
import { ExerciseDefinition, startingWeights } from './program';
import { SetLog } from './types';

interface ExerciseHistory {
  sets: SetLog[];
  date: string;
}

export async function getSuggestedWeights(
  exercises: ExerciseDefinition[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  // Initialize everything with starting weights
  for (const ex of exercises) {
    result[ex.name] = startingWeights[ex.name] ?? 0;
  }

  // Get last 9 completed sessions (enough to find 2 instances of any day in rotation)
  const { data: sessions, error: sessErr } = await supabase
    .from('workout_sessions')
    .select('id, date')
    .eq('is_complete', true)
    .order('date', { ascending: false })
    .limit(9);

  if (sessErr || !sessions || sessions.length === 0) return result;

  const sessionIds = sessions.map((s) => s.id);
  const exerciseNames = exercises.map((e) => e.name);

  // Fetch exercise logs + set_logs for those sessions
  const { data: logs, error: logErr } = await supabase
    .from('exercise_logs')
    .select('id, workout_id, exercise_name, category, set_logs(*)')
    .in('workout_id', sessionIds)
    .in('exercise_name', exerciseNames);

  if (logErr || !logs) return result;

  // Group by exercise name, sorted by session date DESC
  const byExercise: Record<string, ExerciseHistory[]> = {};

  for (const log of logs) {
    const session = sessions.find((s) => s.id === log.workout_id);
    if (!session) continue;

    if (!byExercise[log.exercise_name]) {
      byExercise[log.exercise_name] = [];
    }
    byExercise[log.exercise_name].push({
      sets: (log.set_logs as SetLog[]) ?? [],
      date: session.date,
    });
  }

  for (const name of Object.keys(byExercise)) {
    byExercise[name].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  for (const exercise of exercises) {
    const history = byExercise[exercise.name] ?? [];

    if (history.length === 0) {
      result[exercise.name] = startingWeights[exercise.name] ?? 0;
      continue;
    }

    const last = history[0];
    const lastWeight = last.sets.length > 0 ? Math.max(...last.sets.map((s) => s.weight)) : 0;

    if (exercise.category === 'maintenance' || exercise.category === 'accessory') {
      result[exercise.name] = lastWeight;
      continue;
    }

    // Primary lift progression logic
    const lastAllComplete =
      last.sets.length > 0 && last.sets.every((s) => s.is_complete);

    if (lastAllComplete) {
      const inc = exercise.increment ?? 5;
      result[exercise.name] = lastWeight + inc;
      continue;
    }

    if (history.length >= 2) {
      const prev = history[1];
      const prevAllComplete =
        prev.sets.length > 0 && prev.sets.every((s) => s.is_complete);

      if (!prevAllComplete) {
        // Two consecutive stalls — deload 10%, rounded to nearest 5
        result[exercise.name] = Math.round((lastWeight * 0.9) / 5) * 5;
        continue;
      }
    }

    // Single stall — maintain
    result[exercise.name] = lastWeight;
  }

  return result;
}
