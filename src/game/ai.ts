import {
  BUILDING_COSTS,
  CONVOY_COSTS,
  LASER_KILLS,
  PERSONALITIES,
  SHIP_COSTS,
  SYSTEMS,
  TROOPS_PER_CRUISER,
  TROOP_COST,
  fuelPerCruiser,
  type Cost,
} from './data';
import { launch } from './missions';
import { rand } from './rng';
import { homeOf, planetsOf } from './state';
import type { GameState, Planet } from './types';

/** AI:n betalar mineraler/energi ur sin samlade pott. */
function canAfford(state: GameState, cost: Cost): boolean {
  const e = state.enemy;
  return e.credits >= cost.credits && e.pooledMinerals >= cost.minerals && e.pooledEnergy >= cost.energy;
}

function pay(state: GameState, cost: Cost): void {
  state.enemy.credits -= cost.credits;
  state.enemy.pooledMinerals -= cost.minerals;
  state.enemy.pooledEnergy -= cost.energy;
}

function hasIncomingConvoy(state: GameState, planetId: number): boolean {
  return state.missions.some(
    (m) => m.toId === planetId && (m.type === 'processor' || m.type === 'outpost'),
  );
}

function tryExpand(state: GameState, home: Planet): void {
  const persona = PERSONALITIES[state.personality];
  const neutral = state.planets.filter(
    (p) => p.owner === 'neutral' && !p.terraformingBy && !hasIncomingConvoy(state, p.id),
  );
  if (neutral.length === 0 || rand(state) >= persona.expandChance) return;

  // Bördiga världar terraformas, mineralrika blir utposter.
  const best = neutral.reduce((a, b) =>
    b.fertility + b.mineralRichness > a.fertility + a.mineralRichness ? b : a,
  );
  const asOutpost = best.mineralRichness > best.fertility && best.mineralRichness > 1.0;
  const cost = asOutpost ? CONVOY_COSTS.outpost : CONVOY_COSTS.processor;
  if (!canAfford(state, cost)) return;
  pay(state, cost);
  launch(state, {
    owner: 'enemy',
    type: asOutpost ? 'outpost' : 'processor',
    fromId: home.id,
    toId: best.id,
  });
}

function tryBuild(state: GameState, planet: Planet): void {
  const economist = state.personality === 'economist';
  if (planet.habitable && planet.farms < (economist ? 6 : 4) && canAfford(state, BUILDING_COSTS.farm)) {
    pay(state, BUILDING_COSTS.farm);
    planet.farms++;
  } else if (planet.solarSats < (economist ? 7 : 5) && canAfford(state, BUILDING_COSTS.solarSat)) {
    pay(state, BUILDING_COSTS.solarSat);
    planet.solarSats++;
  } else if (planet.mines < (planet.outpost ? 6 : 4) && canAfford(state, BUILDING_COSTS.mine)) {
    pay(state, BUILDING_COSTS.mine);
    planet.mines++;
  } else if (
    planet.defense < (planet.isHome ? 3 : 2) &&
    state.personality !== 'aggressor' &&
    canAfford(state, BUILDING_COSTS.defense)
  ) {
    pay(state, BUILDING_COSTS.defense);
    planet.defense++;
  }
}

function tryTrainTroops(state: GameState, home: Planet): void {
  const system = SYSTEMS[state.difficulty];
  const persona = PERSONALITIES[state.personality];
  if (home.troops >= system.aiGarrisonCap * persona.garrisonCap) return;
  const batch = 100;
  const cost = {
    credits: batch * TROOP_COST.credits,
    minerals: 0,
    energy: Math.ceil(batch * TROOP_COST.energy),
  };
  if (home.population > batch / 1000 + 200 && canAfford(state, cost) && state.enemy.credits > 3000) {
    pay(state, cost);
    home.population -= Math.ceil(batch / 1000);
    home.troops += batch;
  }
}

function tryInvade(state: GameState, home: Planet): void {
  const system = SYSTEMS[state.difficulty];
  const persona = PERSONALITIES[state.personality];
  if (state.day < system.aiFirstStrikeDay + persona.firstStrikeShift) return;
  if (rand(state) >= system.aiAggression * persona.aggression) return;
  if (home.troops < 500) return;
  // En invasionsflotta i taget.
  if (state.missions.some((m) => m.owner === 'enemy' && m.type === 'invade')) return;

  const targets = planetsOf(state, 'player');
  if (targets.length === 0) return;
  const target = targets.reduce((a, b) =>
    b.troops + b.defense * LASER_KILLS < a.troops + a.defense * LASER_KILLS ? b : a,
  );

  let send = Math.floor(home.troops * 0.7);
  while (
    state.enemy.battleCruisers * TROOPS_PER_CRUISER < send &&
    canAfford(state, SHIP_COSTS.battleCruiser)
  ) {
    pay(state, SHIP_COSTS.battleCruiser);
    state.enemy.battleCruisers++;
  }
  send = Math.min(send, state.enemy.battleCruisers * TROOPS_PER_CRUISER);
  const cruisers = Math.ceil(send / TROOPS_PER_CRUISER);
  const fuel = cruisers * fuelPerCruiser(home.id, target.id);
  if (send < 200 || state.enemy.fuel < fuel) return;
  if (send < (target.troops + target.defense * LASER_KILLS) * 1.2) return;

  state.enemy.fuel -= fuel;
  state.enemy.battleCruisers -= cruisers;
  home.troops -= send;
  launch(state, {
    owner: 'enemy',
    type: 'invade',
    fromId: home.id,
    toId: target.id,
    troops: send,
    battleCruisers: cruisers,
  });
}

/** En dags beslut för fiendehärskaren. */
export function enemyTurn(state: GameState): void {
  const system = SYSTEMS[state.difficulty];
  const persona = PERSONALITIES[state.personality];
  state.enemy.credits += Math.round(system.aiIncome * persona.income);
  state.enemy.fuel += 10;

  const home = homeOf(state, 'enemy');
  if (!home) return;

  tryExpand(state, home);
  for (const planet of planetsOf(state, 'enemy')) {
    if (planet.habitable || planet.outpost) tryBuild(state, planet);
  }
  tryTrainTroops(state, home);
  tryInvade(state, home);
}
