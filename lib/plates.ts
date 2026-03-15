export type PlateMode = 'home' | 'gym';

export interface PlateInventory {
  barWeight: number;
  // plate size -> max pairs available (Infinity = unlimited)
  plates: { size: number; pairs: number }[];
}

export interface PlateResult {
  perSide: number[];
  totalWeight: number;
  achievable: boolean;
}

export interface PlateDelta {
  add: number[];
  remove: number[];
}

export const HOME_INVENTORY: PlateInventory = {
  barWeight: 45,
  plates: [
    { size: 55, pairs: 1 },
    { size: 45, pairs: 1 },
    { size: 35, pairs: 1 },
    { size: 25, pairs: 1 },
    { size: 15, pairs: 1 },
    { size: 10, pairs: 1 },
    { size: 5, pairs: 1 },
    { size: 2.5, pairs: 1 },
  ],
};

export const GYM_INVENTORY: PlateInventory = {
  barWeight: 45,
  plates: [
    { size: 45, pairs: Infinity },
    { size: 35, pairs: Infinity },
    { size: 25, pairs: Infinity },
    { size: 15, pairs: Infinity },
    { size: 10, pairs: Infinity },
    { size: 5, pairs: Infinity },
    { size: 2.5, pairs: Infinity },
  ],
};

export function getInventory(mode: PlateMode): PlateInventory {
  return mode === 'home' ? HOME_INVENTORY : GYM_INVENTORY;
}

/** Greedy largest-first plate calculator */
export function calculatePlates(target: number, inventory: PlateInventory): PlateResult {
  if (target <= inventory.barWeight) {
    return { perSide: [], totalWeight: inventory.barWeight, achievable: target === inventory.barWeight };
  }

  const perSide = (target - inventory.barWeight) / 2;
  let remaining = perSide;
  const result: number[] = [];

  for (const { size, pairs } of inventory.plates) {
    if (remaining <= 0) break;
    const count = Math.min(Math.floor(remaining / size), pairs);
    for (let i = 0; i < count; i++) result.push(size);
    remaining -= count * size;
  }

  const achievedPerSide = result.reduce((a, b) => a + b, 0);
  const totalWeight = inventory.barWeight + achievedPerSide * 2;
  const achievable = Math.abs(remaining) < 0.001;

  return { perSide: result, totalWeight, achievable };
}

/** Frequency map of plate array */
function freqMap(plates: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const p of plates) m.set(p, (m.get(p) ?? 0) + 1);
  return m;
}

/** Count individual plate add/remove operations between two plate configs */
export function changeCost(prev: number[], next: number[]): number {
  const pMap = freqMap(prev);
  const nMap = freqMap(next);
  const allSizes = new Set(Array.from(pMap.keys()).concat(Array.from(nMap.keys())));
  let cost = 0;
  Array.from(allSizes).forEach((size) => {
    cost += Math.abs((pMap.get(size) ?? 0) - (nMap.get(size) ?? 0));
  });
  return cost;
}

/** Returns add/remove arrays for UI display */
export function computePlateDelta(prev: number[], next: number[]): PlateDelta {
  const pMap = freqMap(prev);
  const nMap = freqMap(next);
  const allSizes = new Set(Array.from(pMap.keys()).concat(Array.from(nMap.keys())));
  const add: number[] = [];
  const remove: number[] = [];

  for (const size of Array.from(allSizes).sort((a, b) => b - a)) {
    const p = pMap.get(size) ?? 0;
    const n = nMap.get(size) ?? 0;
    if (n > p) {
      for (let i = 0; i < n - p; i++) add.push(size);
    } else if (p > n) {
      for (let i = 0; i < p - n; i++) remove.push(size);
    }
  }

  return { add, remove };
}

/** Generate all valid plate combos for a given perSide target using bounded backtracking */
function enumerateCombos(
  perSide: number,
  inventory: PlateInventory,
  plateIndex: number,
  current: number[],
  remaining: number,
  results: number[][],
) {
  if (Math.abs(remaining) < 0.001) {
    results.push([...current]);
    return;
  }
  if (plateIndex >= inventory.plates.length) return;
  if (remaining < 0) return;
  // Bound: max possible with remaining plates
  const maxPossible = inventory.plates
    .slice(plateIndex)
    .reduce((s, p) => s + p.size * p.pairs, 0);
  if (maxPossible < remaining - 0.001) return;

  const { size, pairs } = inventory.plates[plateIndex];
  const maxCount = Math.min(Math.floor(remaining / size), pairs);

  // Try from maxCount down to 0
  for (let count = maxCount; count >= 0; count--) {
    for (let i = 0; i < count; i++) current.push(size);
    enumerateCombos(perSide, inventory, plateIndex + 1, current, remaining - count * size, results);
    for (let i = 0; i < count; i++) current.pop();
  }
}

/** Like calculatePlates but picks the combo with minimum changeCost vs prevPlates */
export function calculatePlatesMinimized(
  target: number,
  inventory: PlateInventory,
  prevPlates: number[],
): PlateResult {
  if (target <= inventory.barWeight) {
    return { perSide: [], totalWeight: inventory.barWeight, achievable: target === inventory.barWeight };
  }

  const perSide = (target - inventory.barWeight) / 2;
  const results: number[][] = [];
  enumerateCombos(perSide, inventory, 0, [], perSide, results);

  if (results.length === 0) {
    // Fall back to greedy (unachievable weight)
    return calculatePlates(target, inventory);
  }

  let best = results[0];
  let bestCost = changeCost(prevPlates, best);
  for (const combo of results.slice(1)) {
    const cost = changeCost(prevPlates, combo);
    if (cost < bestCost) {
      bestCost = cost;
      best = combo;
    }
  }

  const achievedPerSide = best.reduce((a, b) => a + b, 0);
  return {
    perSide: best,
    totalWeight: inventory.barWeight + achievedPerSide * 2,
    achievable: true,
  };
}

export interface WarmupStep {
  weight: number;
  plates: PlateResult;
  delta: PlateDelta | null;
  isWork: boolean;
}

/** Generate warmup ramp + work set for a barbell exercise */
export function generateWarmupRamp(
  workWeight: number,
  inventory: PlateInventory,
  minimize = false,
  prevExercisePlates: number[] = [],
): WarmupStep[] {
  if (workWeight <= 0) return [];

  const calc = (target: number, prev: number[]): PlateResult => {
    if (minimize) return calculatePlatesMinimized(target, inventory, prev);
    return calculatePlates(target, inventory);
  };

  // Find nearest achievable weight at a given percentage
  const nearestAchievable = (pct: number): number => {
    const raw = workWeight * pct;
    const result = calculatePlates(raw, inventory);
    return result.totalWeight;
  };

  const barWeight = inventory.barWeight;
  const targets: number[] = [];

  if (workWeight >= 140) {
    targets.push(barWeight);
    targets.push(nearestAchievable(0.5));
    targets.push(nearestAchievable(0.8));
  } else {
    targets.push(barWeight);
    targets.push(nearestAchievable(0.8));
  }
  targets.push(workWeight);

  // Deduplicate consecutive targets
  const deduped: number[] = [targets[0]];
  for (let i = 1; i < targets.length; i++) {
    if (targets[i] !== deduped[deduped.length - 1]) deduped.push(targets[i]);
  }

  const steps: WarmupStep[] = [];
  let prevPlates = prevExercisePlates;

  for (let i = 0; i < deduped.length; i++) {
    const isWork = i === deduped.length - 1;
    const result = calc(deduped[i], prevPlates);

    let delta: PlateDelta | null = null;
    if (i === 0 && prevExercisePlates.length > 0) {
      delta = computePlateDelta(prevExercisePlates, result.perSide);
    } else if (i > 0) {
      delta = computePlateDelta(prevPlates, result.perSide);
    }

    steps.push({ weight: result.totalWeight, plates: result, delta, isWork });
    prevPlates = result.perSide;
  }

  return steps;
}
