'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getDayByTag } from '@/lib/program';
import ExerciseCard from '@/components/ExerciseCard';
import PlateSettingsBar from '@/components/PlateSettingsBar';
import { generateWarmupRamp, getInventory } from '@/lib/plates';
import { loadPlateSettings, savePlateSettings } from '@/lib/plateSettings';
import type { PlateMode, WarmupStep } from '@/lib/plates';
import type { WorkoutSession, ExerciseLogWithSets } from '@/lib/types';

export default function WorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<ExerciseLogWithSets[]>([]);
  const exerciseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [plateMode, setPlateMode] = useState<PlateMode>('home');
  const [minimizeChanges, setMinimizeChanges] = useState(false);

  useEffect(() => {
    const settings = loadPlateSettings();
    setPlateMode(settings.mode);
    setMinimizeChanges(settings.minimizeChanges);
  }, []);

  useEffect(() => {
    if (id) fetchWorkout(id);
  }, [id]);

  function handleModeChange(mode: PlateMode) {
    setPlateMode(mode);
    savePlateSettings({ mode, minimizeChanges });
  }

  function handleMinimizeChange(val: boolean) {
    setMinimizeChanges(val);
    savePlateSettings({ mode: plateMode, minimizeChanges: val });
  }

  async function fetchWorkout(workoutId: string) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        exercise_logs (
          *,
          set_logs (*)
        )
      `)
      .eq('id', workoutId)
      .single();

    if (error || !data) {
      console.error('Workout not found:', error);
      router.push('/');
      return;
    }

    const sortedExercises = (data.exercise_logs as ExerciseLogWithSets[])
      .sort((a, b) => a.display_order - b.display_order)
      .map((ex) => ({
        ...ex,
        set_logs: [...ex.set_logs].sort((a, b) => a.set_number - b.set_number),
      }));

    setSession(data as WorkoutSession);
    setExercises(sortedExercises);
    setLoading(false);
  }

  async function handleSetUpdate(setId: string, weight: number, reps: number) {
    // Optimistic update
    setExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        set_logs: ex.set_logs.map((s) =>
          s.id === setId ? { ...s, weight, reps } : s,
        ),
      })),
    );

    await supabase
      .from('set_logs')
      .update({ weight, reps })
      .eq('id', setId);
  }

  async function handleSetComplete(setId: string) {
    let current = false;
    for (const ex of exercises) {
      const s = ex.set_logs.find((s) => s.id === setId);
      if (s) { current = s.is_complete; break; }
    }
    const next = !current;

    // Scroll to next exercise if this one becomes fully complete
    if (next) {
      const exIndex = exercises.findIndex((ex) => ex.set_logs.some((s) => s.id === setId));
      if (exIndex !== -1) {
        const ex = exercises[exIndex];
        const willBeComplete = ex.set_logs.every((s) => (s.id === setId ? true : s.is_complete));
        if (willBeComplete && exIndex + 1 < exercises.length) {
          setTimeout(() => {
            exerciseRefs.current[exIndex + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      }
    }

    // Optimistic update
    setExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        set_logs: ex.set_logs.map((s) =>
          s.id === setId ? { ...s, is_complete: next } : s,
        ),
      })),
    );

    await supabase
      .from('set_logs')
      .update({ is_complete: next })
      .eq('id', setId);
  }

  async function handleFinishWorkout() {
    setFinishing(true);
    const { error } = await supabase
      .from('workout_sessions')
      .update({ is_complete: true })
      .eq('id', id);

    if (error) {
      console.error('Failed to finish workout:', error);
      setFinishing(false);
      return;
    }

    router.push('/');
  }

  const totalSets = exercises.reduce((acc, ex) => acc + ex.set_logs.length, 0);
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.set_logs.filter((s) => s.is_complete).length,
    0,
  );

  const programDay = session ? getDayByTag(session.day_tag) : undefined;

  // Compute warmup ramp for each barbell exercise
  const inventory = getInventory(plateMode);
  const warmupStepsMap = new Map<string, WarmupStep[]>();
  let prevWorkPlates: number[] = [];

  for (const ex of exercises) {
    const def = programDay?.exercises.find((e) => e.name === ex.exercise_name);
    if (def?.equipment !== 'barbell') continue;

    const workWeight = ex.set_logs[0]?.weight ?? 0;
    if (workWeight <= 0) continue;

    const steps = generateWarmupRamp(workWeight, inventory, minimizeChanges, prevWorkPlates);
    warmupStepsMap.set(ex.id, steps);

    const workStep = steps.find((s) => s.isWork);
    if (workStep) prevWorkPlates = workStep.plates.perSide;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium">
              Week {session?.week_number} of 12
            </p>
            <h1 className="text-xl font-bold mt-0.5">{session?.day_name}</h1>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs">Progress</p>
            <p className="text-lg font-bold">
              {completedSets}
              <span className="text-zinc-600">/{totalSets}</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 rounded-full transition-all duration-300"
            style={{ width: totalSets > 0 ? `${(completedSets / totalSets) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Plate settings */}
      <PlateSettingsBar
        mode={plateMode}
        minimizeChanges={minimizeChanges}
        onModeChange={handleModeChange}
        onMinimizeChange={handleMinimizeChange}
      />

      {/* Exercise cards */}
      <div className="space-y-4">
        {exercises.map((ex, i) => {
          const def = programDay?.exercises.find((e) => e.name === ex.exercise_name);
          return (
            <div key={ex.id} ref={(el) => { exerciseRefs.current[i] = el; }}>
              <ExerciseCard
                exercise={ex}
                repRange={def?.repRange}
                targetRpe={def?.sets[0]?.targetRpe}
                onSetUpdate={handleSetUpdate}
                onSetComplete={handleSetComplete}
                warmupSteps={warmupStepsMap.get(ex.id)}
                showPlateDeltas={minimizeChanges}
              />
            </div>
          );
        })}
      </div>

      {/* Finish button */}
      <div className="pt-2 pb-4">
        <button
          onClick={handleFinishWorkout}
          disabled={finishing}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl transition-colors"
        >
          {finishing ? 'Saving…' : 'Finish Workout'}
        </button>
      </div>
    </main>
  );
}
