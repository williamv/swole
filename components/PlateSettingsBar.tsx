'use client';

import type { PlateMode } from '@/lib/plates';

interface PlateSettingsBarProps {
  mode: PlateMode;
  minimizeChanges: boolean;
  onModeChange: (mode: PlateMode) => void;
  onMinimizeChange: (val: boolean) => void;
}

export default function PlateSettingsBar({
  mode,
  minimizeChanges,
  onModeChange,
  onMinimizeChange,
}: PlateSettingsBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-zinc-900 rounded-xl px-3 py-2">
      {/* Mode segmented control */}
      <div className="flex bg-zinc-800 rounded-lg p-0.5">
        {(['home', 'gym'] as PlateMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
              mode === m
                ? 'bg-zinc-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Minimize changes toggle */}
      <button
        onClick={() => onMinimizeChange(!minimizeChanges)}
        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span>Min swaps</span>
        <div
          className={`w-8 h-4 rounded-full transition-colors relative ${
            minimizeChanges ? 'bg-violet-600' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
              minimizeChanges ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
      </button>
    </div>
  );
}
