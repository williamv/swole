'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkoutSession, ExerciseLogWithSets } from '@/lib/types';

interface WorkoutSummaryCardProps {
  session: WorkoutSession;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WorkoutSummaryCard({ session }: WorkoutSummaryCardProps) {
  const [exercises, setExercises] = useState<ExerciseLogWithSets[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('exercise_logs')
        .select('*, set_logs(*)')
        .eq('workout_id', session.id)
        .in('category', ['primaryPush', 'primaryPull'])
        .order('display_order', { ascending: true });

      setExercises(data ?? []);
    }
    fetch();
  }, [session.id]);

  // Get top weight per primary exercise
  const highlights = exercises
    .map((ex) => {
      const maxWeight = ex.set_logs.length > 0 ? Math.max(...ex.set_logs.map((s) => s.weight)) : 0;
      return { name: ex.exercise_name, weight: maxWeight };
    })
    .filter((h) => h.weight > 0)
    .slice(0, 3);

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium">
            Last Workout
          </p>
          <p className="font-bold mt-0.5">{session.day_name}</p>
        </div>
        <p className="text-zinc-600 text-sm">{formatDate(session.date)}</p>
      </div>

      {highlights.length > 0 && (
        <>
          <div className="h-px bg-zinc-800" />
          <div className="space-y-1.5">
            {highlights.map((h) => (
              <div key={h.name} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{h.name}</span>
                <span className="font-bold text-white">{h.weight} lbs</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
