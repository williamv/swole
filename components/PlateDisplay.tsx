'use client';

import type { WarmupStep } from '@/lib/plates';

interface PlateDisplayProps {
  steps: WarmupStep[];
  showDeltas: boolean;
}

function formatPlates(perSide: number[]): string {
  if (perSide.length === 0) return 'bar only';
  // Group consecutive same plates: e.g. [45, 25, 10, 10] → "45 | 25 | 10×2"
  const groups: { size: number; count: number }[] = [];
  for (const p of perSide) {
    if (groups.length > 0 && groups[groups.length - 1].size === p) {
      groups[groups.length - 1].count++;
    } else {
      groups.push({ size: p, count: 1 });
    }
  }
  return groups.map((g) => (g.count > 1 ? `${g.size}×${g.count}` : `${g.size}`)).join(' | ');
}

function formatDelta(delta: { add: number[]; remove: number[] } | null): string | null {
  if (!delta) return null;
  if (delta.add.length === 0 && delta.remove.length === 0) return null;
  const parts: string[] = [];
  if (delta.remove.length > 0) {
    parts.push(`−${delta.remove.join(', ')}`);
  }
  if (delta.add.length > 0) {
    parts.push(`+${delta.add.join(', ')}`);
  }
  return parts.join('  ');
}

export default function PlateDisplay({ steps, showDeltas }: PlateDisplayProps) {
  if (steps.length === 0) return null;

  const warmupSteps = steps.filter((s) => !s.isWork);
  const workStep = steps.find((s) => s.isWork);

  return (
    <div className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 space-y-1 text-xs font-mono">
      {warmupSteps.length > 0 && (
        <>
          <p className="text-zinc-600 uppercase tracking-widest text-[10px] font-sans mb-1">Warmup</p>
          {warmupSteps.map((step, i) => {
            const delta = showDeltas ? formatDelta(step.delta) : null;
            return (
              <div key={i} className="flex items-baseline gap-2 text-zinc-500">
                <span className="w-14 text-right shrink-0">{step.weight} lbs</span>
                <span className="flex-1">
                  {step.plates.achievable
                    ? formatPlates(step.plates.perSide)
                    : `${formatPlates(step.plates.perSide)} ⚠`}
                </span>
                {delta && <span className="text-zinc-600 shrink-0">{delta}</span>}
              </div>
            );
          })}
        </>
      )}

      {workStep && (
        <>
          <div className="h-px bg-zinc-800 my-1" />
          <p className="text-zinc-600 uppercase tracking-widest text-[10px] font-sans mb-1">Work</p>
          <div className="flex items-baseline gap-2 text-white font-bold">
            <span className="w-14 text-right shrink-0">{workStep.weight} lbs</span>
            <span className="flex-1">
              {workStep.plates.achievable
                ? formatPlates(workStep.plates.perSide)
                : `${formatPlates(workStep.plates.perSide)} ⚠ nearest`}
            </span>
            {showDeltas && formatDelta(workStep.delta) && (
              <span className="text-zinc-400 font-normal shrink-0">{formatDelta(workStep.delta)}</span>
            )}
          </div>
          {!workStep.plates.achievable && (
            <p className="text-amber-500 text-[10px] font-sans">
              {workStep.weight} lbs not achievable — showing nearest lower weight
            </p>
          )}
        </>
      )}
    </div>
  );
}
