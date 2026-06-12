import { PERSONALITIES, PLANET_NAMES, SAVE_VERSION, SYSTEMS } from './data';
import { rand, randRange } from './rng';
import type { AiPersonality, Difficulty, Faction, GameState, Owner, Planet } from './types';

function emptyPlanet(id: number, name: string): Planet {
  return {
    id,
    name,
    owner: 'neutral',
    habitable: false,
    outpost: false,
    terraformDaysLeft: 0,
    terraformingBy: null,
    population: 0,
    morale: 70,
    taxRate: 25,
    troops: 0,
    mines: 0,
    farms: 0,
    solarSats: 0,
    defense: 0,
    mineralRichness: 1,
    fertility: 1,
    solarFlux: 1,
    isHome: false,
    food: 0,
    energy: 0,
    minerals: 0,
    scoutedUntil: 0,
  };
}

function startingFaction(boost: number): Faction {
  return {
    credits: Math.round(15000 * boost),
    fuel: Math.round(300 * boost),
    battleCruisers: 2,
    cargoCruisers: 2,
    pooledFood: Math.round(500 * boost),
    pooledEnergy: Math.round(400 * boost),
    pooledMinerals: Math.round(600 * boost),
  };
}

function setupHome(planet: Planet, owner: Owner, boost: number): void {
  planet.owner = owner;
  planet.habitable = true;
  planet.isHome = true;
  planet.population = Math.round(4000 * boost);
  planet.morale = 80;
  planet.taxRate = 25;
  planet.troops = Math.round(600 * boost);
  planet.mines = 3;
  planet.farms = Math.round(4 * boost);
  planet.solarSats = 4;
  planet.defense = 2;
  planet.food = 500;
  planet.energy = 400;
  planet.minerals = 600;
}

export function newGame(difficulty: Difficulty, seed = Date.now() | 0): GameState {
  const system = SYSTEMS[difficulty];
  const planets: Planet[] = [];

  const home = emptyPlanet(0, 'Starbase');
  planets.push(home);

  for (let i = 1; i < system.planetCount - 1; i++) {
    planets.push(emptyPlanet(i, PLANET_NAMES[(i - 1) % PLANET_NAMES.length]));
  }

  const enemyHome = emptyPlanet(system.planetCount - 1, system.fortress);
  planets.push(enemyHome);

  const state: GameState = {
    version: SAVE_VERSION,
    day: 1,
    difficulty,
    personality: 'aggressor',
    status: 'playing',
    planets,
    player: startingFaction(1),
    enemy: startingFaction(system.aiStartBoost),
    missions: [],
    nextMissionId: 1,
    marketSwings: {},
    history: [],
    log: [],
    seed,
  };

  const personalities = Object.keys(PERSONALITIES) as AiPersonality[];
  state.personality = personalities[Math.floor(rand(state) * personalities.length)];

  setupHome(home, 'player', 1);
  setupHome(enemyHome, 'enemy', system.aiStartBoost);

  for (const p of planets) {
    if (!p.isHome) {
      p.mineralRichness = +randRange(state, 0.6, 1.4).toFixed(2);
      p.fertility = +randRange(state, 0.6, 1.4).toFixed(2);
      p.solarFlux = +randRange(state, 0.7, 1.3).toFixed(2);
    }
  }

  log(state, 'log.arrival', {
    system: system.name,
    opponent: `@opp.${difficulty}`,
    fortress: system.fortress,
  });
  log(state, 'log.personalityHint', { style: `@style.${state.personality}` });

  return state;
}

export function log(
  state: GameState,
  key: string,
  params?: Record<string, string | number>,
  kind: 'info' | 'good' | 'bad' = 'info',
): void {
  state.log.push({ day: state.day, key, params, kind });
  if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
}

export function factionOf(state: GameState, owner: Owner): Faction {
  return owner === 'player' ? state.player : state.enemy;
}

export function planetsOf(state: GameState, owner: Owner): Planet[] {
  return state.planets.filter((p) => p.owner === owner);
}

export function homeOf(state: GameState, owner: Owner): Planet | undefined {
  return state.planets.find((p) => p.isHome && p.owner === owner);
}

/** Kolonier (med befolkning) — utposter exkluderade. */
export function coloniesOf(state: GameState, owner: Owner): Planet[] {
  return planetsOf(state, owner).filter((p) => p.habitable);
}
