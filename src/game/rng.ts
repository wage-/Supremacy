import type { GameState } from './types';

/** Mulberry32 — deterministic given the state's seed, which it advances. */
export function rand(state: GameState): number {
  state.seed = (state.seed + 0x6d2b79f5) | 0;
  let t = state.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Uniform float in [min, max). */
export function randRange(state: GameState, min: number, max: number): number {
  return min + rand(state) * (max - min);
}
