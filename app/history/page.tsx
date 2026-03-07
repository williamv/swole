'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { WorkoutSession } from '@/lib/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('is_complete', true)
        .order('date', { ascending: false });

      setSessions(data ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <div className="pt-6 pb-2">
        <h1 className="text-3xl font-black tracking-tight">History</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {sessions.length} workout{sessions.length !== 1 ? 's' : ''} completed
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-lg">No workouts yet.</p>
          <p className="text-sm mt-1">Start your first session from the Today tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => router.push(`/history/${session.id}`)}
              className="w-full text-left bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{session.day_name}</p>
                  <p className="text-zinc-500 text-sm mt-0.5">{formatDate(session.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-zinc-600 font-medium">
                    Week {session.week_number}
                  </span>
                  <svg
                    className="ml-auto mt-1 text-zinc-700"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M6 12l4-4-4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
