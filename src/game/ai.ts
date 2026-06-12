import { resolveInvasion } from './combat';
import {
  BUILDING_COSTS,
  FUEL_PER_CRUISER_MISSION,
  LASER_KILLS,
  SHIP_COSTS,
  SYSTEMS,
  TERRAFORM_DAYS,
  TROOPS_PER_CRUISER,
  TROOP_COST,
} from './data';
import { rand } from './rng';
import { homeOf, planetsOf } from './state';
import type { GameState, Planet } from './types';

function canAfford(state: GameState, cost: { credits: number; minerals: number; energy: number }): boolean {
  const e = state.enemy;
  return e.credits >= cost.credits && e.minerals >= cost.minerals && e.energy >= cost.energy;
}

function pay(state: GameState, cost: { credits: number; minerals: number; energy: number }): void {
  state.enemy.credits -= cost.credits;
  state.enemy.minerals -= cost.minerals;
  state.enemy.energy -= cost.energy;
}

function tryExpand(state: GameState): void {
  const neutral = state.planets.filter((p) => p.owner === 'neutral' && p.terraformingBy === null);
  if (neutral.length === 0) return;

  if (state.enemy.atmosphereProcessors > 0) {
    const target = neutral.reduce((a, b) => (b.fertility + b.mineralRichness > a.fertility + a.mineralRichness ? b : a));
    state.enemy.atmosphereProcessors--;
    target.terraformingBy = 'enemy';
    target.terraformDaysLeft = TERRAFORM_DAYS;
    return;
  }
  if (canAfford(state, SHIP_COSTS.atmosphereProcessor) && rand(state) < 0.4) {
    pay(state, SHIP_COSTS.atmosphereProcessor);
    state.enemy.atmosphereProcessors++;
  }
}

function tryBuild(state: GameState, planet: Planet): void {
  if (planet.farms < 4 && canAfford(state, BUILDING_COSTS.farm)) {
    pay(state, BUILDING_COSTS.farm);
    planet.farms++;
  } else if (planet.solarSats < 5 && canAfford(state, BUILDING_COSTS.solarSat)) {
    pay(state, BUILDING_COSTS.solarSat);
    planet.solarSats++;
  } else if (planet.mines < 4 && canAfford(state, BUILDING_COSTS.mine)) {
    pay(state, BUILDING_COSTS.mine);
    planet.mines++;
  } else if (planet.defense < (planet.isHome ? 3 : 2) && canAfford(state, BUILDING_COSTS.defense)) {
    pay(state, BUILDING_COSTS.defense);
    planet.defense++;
  }
}

function tryTrainTroops(state: GameState, home: Planet): void {
  const system = SYSTEMS[state.difficulty];
  if (home.troops >= system.aiGarrisonCap) return;
  const batch = 100;
  const cost = { credits: batch * TROOP_COST.credits, minerals: 0, energy: Math.ceil(batch * TROOP_COST.energy) };
  if (home.population > batch / 1000 + 200 && canAfford(state, cost) && state.enemy.credits > 3000) {
    pay(state, cost);
    home.population -= Math.ceil(batch / 1000);
    home.troops += batch;
  }
}

function tryInvade(state: GameState, home: Planet): void {
  const system = SYSTEMS[state.difficulty];
  if (state.day < system.aiFirstStrikeDay) return;
  if (rand(state) >= system.aiAggression) return;
  if (home.troops < 500) return;

  const targets = planetsOf(state, 'player');
  if (targets.length === 0) return;
  const target = targets.reduce((a, b) =>
    b.troops + b.defense * LASER_KILLS < a.troops + a.defense * LASER_KILLS ? b : a,
  );

  let send = Math.floor(home.troops * 0.7);
  // Buy transport capacity if needed and affordable.
  while (
    state.enemy.battleCruisers * TROOPS_PER_CRUISER < send &&
    canAfford(state, SHIP_COSTS.battleCruiser)
  ) {
    pay(state, SHIP_COSTS.battleCruiser);
    state.enemy.battleCruisers++;
  }
  send = Math.min(send, state.enemy.battleCruisers * TROOPS_PER_CRUISER);
  const cruisers = Math.ceil(send / TROOPS_PER_CRUISER);
  const fuel = cruisers * FUEL_PER_CRUISER_MISSION;
  if (send < 200 || state.enemy.fuel < fuel) return;
  // Only strike when the odds look good.
  if (send < (target.troops + target.defense * LASER_KILLS) * 1.2) return;

  state.enemy.fuel -= fuel;
  home.troops -= send;
  resolveInvasion(state, target, 'enemy', send);
}

/** One day of decisions for the enemy overlord. */
export function enemyTurn(state: GameState): void {
  const system = SYSTEMS[state.difficulty];
  state.enemy.credits += system.aiIncome;
  state.enemy.fuel += 10;

  const home = homeOf(state, 'enemy');
  if (!home) return;

  tryExpand(state);
  for (const planet of planetsOf(state, 'enemy')) {
    if (planet.habitable) tryBuild(state, planet);
  }
  tryTrainTroops(state, home);
  tryInvade(state, home);
}
