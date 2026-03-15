import type { PlateMode } from './plates';

export interface PlateSettings {
  mode: PlateMode;
  minimizeChanges: boolean;
}

const KEY = 'plate_settings';
const DEFAULTS: PlateSettings = { mode: 'home', minimizeChanges: false };

export function loadPlateSettings(): PlateSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function savePlateSettings(settings: PlateSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}
