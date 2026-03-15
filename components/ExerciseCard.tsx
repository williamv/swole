'use client';

import SetRow from './SetRow';
import PlateDisplay from './PlateDisplay';
import { categoryLabel, categoryColor, type ExerciseCategory } from '@/lib/program';
import type { ExerciseLogWithSets } from '@/lib/types';
import type { WarmupStep } from '@/lib/plates';

interface ExerciseCardProps {
  exercise: ExerciseLogWithSets;
  repRange?: string;
  targetRpe?: number;
  onSetUpdate: (setId: string, weight: number, reps: number) => void;
  onSetComplete: (setId: string) => void;
  warmupSteps?: WarmupStep[];
  showPlateDeltas?: boolean;
}

export default function ExerciseCard({
  exercise,
  repRange,
  targetRpe,
  onSetUpdate,
  onSetComplete,
  warmupSteps,
  showPlateDeltas = false,
}: ExerciseCardProps) {
  const completedCount = exercise.set_logs.filter((s) => s.is_complete).length;
  const totalCount = exercise.set_logs.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div
      className={`bg-zinc-900 rounded-2xl p-4 space-y-3 transition-opacity ${
        allDone ? 'opacity-80' : ''
      }`}
    >
      {/* Exercise header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                categoryColor[exercise.category as ExerciseCategory]
              }`}
            >
              {categoryLabel[exercise.category as ExerciseCategory]}
            </span>
            <h3 className="font-bold text-white">{exercise.exercise_name}</h3>
          </div>
          {(repRange || targetRpe) && (
            <p className="text-zinc-600 text-xs mt-1">
              {repRange && <span>{repRange} reps</span>}
              {targetRpe && <span className="ml-2">@ RPE {targetRpe}</span>}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span
            className={`text-sm font-bold ${
              allDone ? 'text-emerald-500' : 'text-zinc-500'
            }`}
          >
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Plate display */}
      {warmupSteps && warmupSteps.length > 0 && (
        <PlateDisplay steps={warmupSteps} showDeltas={showPlateDeltas} />
      )}

      {/* Divider */}
      <div className="h-px bg-zinc-800" />

      {/* Column labels */}
      <div className="flex items-center gap-3 px-0">
        <span className="text-zinc-700 text-xs w-10 shrink-0" />
        <span className="text-zinc-700 text-xs w-20 text-center">lbs</span>
        <span className="text-zinc-700 text-xs w-4 text-center" />
        <span className="text-zinc-700 text-xs w-16 text-center">reps</span>
      </div>

      {/* Sets */}
      <div className="space-y-2">
        {exercise.set_logs.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            onUpdate={onSetUpdate}
            onComplete={onSetComplete}
          />
        ))}
      </div>
    </div>
  );
}
