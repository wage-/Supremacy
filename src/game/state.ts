import { PLANET_NAMES, SYSTEMS } from './data';
import { randRange } from './rng';
import type { Difficulty, Faction, GameState, Owner, Planet } from './types';

function emptyPlanet(id: number, name: string): Planet {
  return {
    id,
    name,
    owner: 'neutral',
    habitable: false,
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
  };
}

function startingFaction(boost: number): Faction {
  return {
    credits: Math.round(15000 * boost),
    food: Math.round(500 * boost),
    energy: Math.round(400 * boost),
    minerals: Math.round(600 * boost),
    fuel: Math.round(300 * boost),
    battleCruisers: 2,
    atmosphereProcessors: 0,
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
}

export function newGame(difficulty: Difficulty, seed = Date.now() | 0): GameState {
  const system = SYSTEMS[difficulty];
  const planets: Planet[] = [];

  const home = emptyPlanet(0, 'Starbas');
  planets.push(home);

  for (let i = 1; i < system.planetCount - 1; i++) {
    planets.push(emptyPlanet(i, PLANET_NAMES[(i - 1) % PLANET_NAMES.length]));
  }

  const enemyHome = emptyPlanet(system.planetCount - 1, system.opponent);
  planets.push(enemyHome);

  const state: GameState = {
    day: 1,
    difficulty,
    status: 'playing',
    planets,
    player: startingFaction(1),
    enemy: startingFaction(system.aiStartBoost),
    log: [],
    seed,
  };

  setupHome(home, 'player', 1);
  setupHome(enemyHome, 'enemy', system.aiStartBoost);

  for (const p of planets) {
    if (!p.isHome) {
      p.mineralRichness = +randRange(state, 0.6, 1.4).toFixed(2);
      p.fertility = +randRange(state, 0.6, 1.4).toFixed(2);
      p.solarFlux = +randRange(state, 0.7, 1.3).toFixed(2);
    }
  }

  state.log.push({
    day: 1,
    text: `Du anländer till ${system.name}. ${system.opponent} härskar över ${enemyHome.name}-fästet. Erövra det – eller gå under.`,
    kind: 'info',
  });

  return state;
}

export function log(state: GameState, text: string, kind: 'info' | 'good' | 'bad' = 'info'): void {
  state.log.push({ day: state.day, text, kind });
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
