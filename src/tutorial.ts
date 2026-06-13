import { homeOf, planetsOf } from './game/state';
import type { GameState } from './game/types';

/**
 * En handledningsstegs logik. Texten ligger i i18n under tut.{index}.title/body.
 * - `capture` läser ett baslinjevärde när steget blir aktivt.
 * - `done` returnerar true (jämfört med baslinjen) när steget är avklarat och
 *   handledningen ska gå vidare automatiskt. Saknas `done` är steget
 *   informativt och avancerar med Nästa-knappen.
 * - `select` pekar ut en planet att markera när steget öppnas, som vägledning.
 */
export interface TutorialStep {
  capture?: (s: GameState) => number;
  done?: (s: GameState, baseline: number) => boolean;
  select?: (s: GameState) => number | null;
}

function homeBuildings(s: GameState): number {
  const h = homeOf(s, 'player');
  return h ? h.mines + h.farms + h.solarSats + h.defense : 0;
}

const homeId = (s: GameState) => homeOf(s, 'player')?.id ?? null;
const neutralId = (s: GameState) => s.planets.find((p) => p.owner === 'neutral')?.id ?? null;
const enemyId = (s: GameState) => s.planets.find((p) => p.owner === 'enemy')?.id ?? null;

export const TUTORIAL_STEPS: TutorialStep[] = [
  // 0 Välkommen
  {},
  // 1 Hemplaneten
  { select: homeId },
  // 2 Bygg
  { select: homeId, capture: homeBuildings, done: (s, b) => homeBuildings(s) > b },
  // 3 Skatt (informativt)
  { select: homeId },
  // 4 Avsluta dagen
  { capture: (s) => s.day, done: (s, b) => s.day > b },
  // 5 Kolonisera
  {
    select: neutralId,
    done: (s) =>
      planetsOf(s, 'player').length > 1 ||
      s.missions.some((m) => m.owner === 'player' && (m.type === 'processor' || m.type === 'outpost')),
  },
  // 6 Värva trupper
  {
    select: homeId,
    capture: (s) => homeOf(s, 'player')?.troops ?? 0,
    done: (s, b) => (homeOf(s, 'player')?.troops ?? 0) > b,
  },
  // 7 Spana
  {
    select: enemyId,
    done: (s) =>
      s.missions.some((m) => m.owner === 'player' && m.type === 'probe') ||
      s.planets.some((p) => p.owner === 'enemy' && p.scoutedUntil > 0),
  },
  // 8 Kriget (informativt)
  { select: enemyId },
  // 9 Lycka till
  {},
];

export const TUTORIAL_COUNT = TUTORIAL_STEPS.length;
