'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  getNextDay,
  calculateWeekNumber,
  categoryLabel,
  categoryColor,
  type ExerciseCategory,
} from '@/lib/program';
import { getSuggestedWeights } from '@/lib/progression';
import WorkoutSummaryCard from '@/components/WorkoutSummaryCard';
import type { WorkoutSession } from '@/lib/types';

export default function TodayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [lastCompleted, setLastCompleted] = useState<WorkoutSession | null>(null);
  const [incompleteSession, setIncompleteSession] = useState<WorkoutSession | null>(null);
  const [firstSessionDate, setFirstSessionDate] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [{ data: completed }, { data: incomplete }, { data: first }] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('is_complete', true)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('is_complete', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('workout_sessions')
        .select('date')
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    setLastCompleted(completed);
    setIncompleteSession(incomplete);
    setFirstSessionDate(first?.date ?? null);
    setLoading(false);
  }

  async function handleStartWorkout() {
    setStarting(true);
    try {
      const nextDay = getNextDay(lastCompleted?.day_tag);
      const weekNumber = calculateWeekNumber(firstSessionDate);

      // Get suggested weights for all exercises in the next day
      const weights = await getSuggestedWeights(nextDay.exercises);

      // Create the workout session
      const { data: session, error: sessErr } = await supabase
        .from('workout_sessions')
        .insert({
          day_tag: nextDay.tag,
          day_name: nextDay.name,
          week_number: weekNumber,
          is_complete: false,
        })
        .select()
        .single();

      if (sessErr || !session) throw sessErr ?? new Error('Failed to create session');

      // Create exercise logs
      const exerciseRows = nextDay.exercises.map((ex, i) => ({
        workout_id: session.id,
        exercise_name: ex.name,
        display_order: i,
        category: ex.category,
      }));

      const { data: exerciseLogs, error: exErr } = await supabase
        .from('exercise_logs')
        .insert(exerciseRows)
        .select();

      if (exErr || !exerciseLogs) throw exErr ?? new Error('Failed to create exercise logs');

      // Create set logs with pre-filled weights
      const setRows = [];
      for (const exercise of nextDay.exercises) {
        const log = exerciseLogs.find((el) => el.exercise_name === exercise.name);
        if (!log) continue;
        const weight = weights[exercise.name] ?? 0;
        for (const set of exercise.sets) {
          setRows.push({
            exercise_id: log.id,
            set_number: set.setNumber,
            weight,
            reps: set.targetReps,
            is_complete: false,
          });
        }
      }

      const { error: setErr } = await supabase.from('set_logs').insert(setRows);
      if (setErr) throw setErr;

      router.push(`/workout/${session.id}`);
    } catch (err) {
      console.error('Failed to start workout:', err);
      setStarting(false);
    }
  }

  const nextDay = getNextDay(lastCompleted?.day_tag);
  const weekNumber = calculateWeekNumber(firstSessionDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-6 pb-2">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
          Week {weekNumber} of 12
        </p>
        <h1 className="text-3xl font-black tracking-tight mt-1">SWOLE</h1>
      </div>

      {/* Next workout preview */}
      <div className="bg-zinc-900 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium mb-1">
            Next Up
          </p>
          <h2 className="text-lg font-bold">{nextDay.name}</h2>
        </div>

        <ul className="space-y-2">
          {nextDay.exercises.map((ex) => (
            <li key={ex.name} className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  categoryColor[ex.category as ExerciseCategory]
                }`}
              >
                {categoryLabel[ex.category as ExerciseCategory]}
              </span>
              <span className="text-sm text-zinc-300">{ex.name}</span>
              <span className="text-xs text-zinc-600 ml-auto">
                {ex.sets.length}×{ex.repRange}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action button */}
      {incompleteSession ? (
        <button
          onClick={() => router.push(`/workout/${incompleteSession.id}`)}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg py-4 rounded-2xl transition-colors"
        >
          Continue Workout
        </button>
      ) : (
        <button
          onClick={handleStartWorkout}
          disabled={starting}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl transition-colors"
        >
          {starting ? 'Starting…' : 'Start Workout'}
        </button>
      )}

      {/* Last workout summary */}
      {lastCompleted && <WorkoutSummaryCard session={lastCompleted} />}
    </main>
  );
}
