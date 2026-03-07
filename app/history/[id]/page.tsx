'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { categoryLabel, categoryColor, type ExerciseCategory } from '@/lib/program';
import type { WorkoutSessionFull } from '@/lib/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSessionFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercise_logs (
            *,
            set_logs (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        router.push('/history');
        return;
      }

      const sorted = {
        ...data,
        exercise_logs: data.exercise_logs
          .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
          .map((ex: { set_logs: { set_number: number }[] }) => ({
            ...ex,
            set_logs: [...ex.set_logs].sort((a, b) => a.set_number - b.set_number),
          })),
      };

      setSession(sorted as WorkoutSessionFull);
      setLoading(false);
    }
    fetch();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const totalSets = session.exercise_logs.reduce((acc, ex) => acc + ex.set_logs.length, 0);
  const completedSets = session.exercise_logs.reduce(
    (acc, ex) => acc + ex.set_logs.filter((s) => s.is_complete).length,
    0,
  );

  return (
    <main className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-6 pb-2">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 text-sm flex items-center gap-1 mb-4 -ml-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          History
        </button>
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium">
          Week {session.week_number} of 12
        </p>
        <h1 className="text-xl font-bold mt-0.5">{session.day_name}</h1>
        <p className="text-zinc-500 text-sm mt-1">{formatDate(session.date)}</p>
        <p className="text-zinc-600 text-sm mt-1">
          {completedSets}/{totalSets} sets completed
        </p>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {session.exercise_logs.map((ex) => (
          <div key={ex.id} className="bg-zinc-900 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  categoryColor[ex.category as ExerciseCategory]
                }`}
              >
                {categoryLabel[ex.category as ExerciseCategory]}
              </span>
              <h3 className="font-bold">{ex.exercise_name}</h3>
            </div>

            <div className="space-y-2">
              {ex.set_logs.map((set) => (
                <div
                  key={set.id}
                  className={`flex items-center gap-3 text-sm ${
                    set.is_complete ? '' : 'opacity-40'
                  }`}
                >
                  <span className="text-zinc-600 w-12 shrink-0">Set {set.set_number}</span>
                  <span className="font-bold text-white">{set.weight} lbs</span>
                  <span className="text-zinc-500">×</span>
                  <span className="font-bold text-white">{set.reps} reps</span>
                  {set.is_complete && (
                    <span className="ml-auto text-emerald-500">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8l4 4 6-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
