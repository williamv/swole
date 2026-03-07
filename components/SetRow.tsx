'use client';

import { useState, useEffect } from 'react';
import type { SetLog } from '@/lib/types';

interface SetRowProps {
  set: SetLog;
  onUpdate: (setId: string, weight: number, reps: number) => void;
  onComplete: (setId: string) => void;
}

export default function SetRow({ set, onUpdate, onComplete }: SetRowProps) {
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));

  // Sync if parent updates (e.g. re-fetch)
  useEffect(() => {
    setWeight(String(set.weight));
    setReps(String(set.reps));
  }, [set.weight, set.reps]);

  function handleBlur() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    onUpdate(set.id, w, r);
  }

  function handleComplete() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    onUpdate(set.id, w, r);
    onComplete(set.id);
  }

  return (
    <div
      className={`flex items-center gap-3 py-1 transition-opacity ${
        set.is_complete ? 'opacity-50' : ''
      }`}
    >
      <span className="text-zinc-600 text-xs font-medium w-10 shrink-0 uppercase tracking-wide">
        Set {set.set_number}
      </span>

      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        className="
          w-20 h-12 text-center text-xl font-bold
          bg-zinc-800 border border-zinc-700 rounded-xl
          text-white placeholder-zinc-600
          focus:outline-none focus:border-violet-500
          transition-colors
        "
      />

      <span className="text-zinc-600 text-lg select-none">×</span>

      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        className="
          w-16 h-12 text-center text-xl font-bold
          bg-zinc-800 border border-zinc-700 rounded-xl
          text-white placeholder-zinc-600
          focus:outline-none focus:border-violet-500
          transition-colors
        "
      />

      <button
        onClick={handleComplete}
        aria-label={set.is_complete ? 'Undo set' : 'Mark set complete'}
        className={`
          ml-auto w-12 h-12 rounded-full flex items-center justify-center shrink-0
          transition-all duration-150
          ${
            set.is_complete
              ? 'bg-emerald-600 text-white scale-95'
              : 'border-2 border-zinc-700 text-zinc-700 hover:border-emerald-500 hover:text-emerald-500 active:scale-95'
          }
        `}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 10l5 5 7-8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
