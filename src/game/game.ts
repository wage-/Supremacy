import { enemyTurn } from './ai';
import {
  BUILDING_COSTS,
  CARGO_PER_CRUISER,
  CONVOY_COSTS,
  SHIP_COSTS,
  TROOPS_PER_CRUISER,
  TROOP_COST,
  fuelPerCruiser,
  type Cost,
} from './data';
import { runEconomy, runTerraforming } from './economy';
import { marketPrice, runEvents } from './events';
import { launch } from './missions';
import { runMissions } from './missions';
import { homeOf, log, planetsOf } from './state';
import type { Building, GameState, LocalResource, Planet, Resource } from './types';

export interface ActionError {
  key: string;
  params?: Record<string, string | number>;
}
export type ActionResult = ActionError | null; // fel, eller null vid framgång

function err(key: string, params?: Record<string, string | number>): ActionError {
  return { key, params };
}

function planet(state: GameState, id: number): Planet {
  const p = state.planets.find((x) => x.id === id);
  if (!p) throw new Error(`Okänd planet: ${id}`);
  return p;
}

/** Betala krediter globalt och mineraler/energi ur planetens lokala lager. */
function payAt(state: GameState, site: Planet, cost: Cost): ActionResult {
  if (state.player.credits < cost.credits) return err('err.credits');
  if (site.minerals < cost.minerals) return err('err.minerals', { planet: site.name });
  if (site.energy < cost.energy) return err('err.energy', { planet: site.name });
  state.player.credits -= cost.credits;
  site.minerals -= cost.minerals;
  site.energy -= cost.energy;
  return null;
}

function playerHome(state: GameState): Planet | null {
  return homeOf(state, 'player') ?? null;
}

// ---------- Marknad (handlas via hemplanetens lager) ----------

export function buyResource(state: GameState, resource: Resource, amount: number): ActionResult {
  if (amount <= 0) return err('err.amount');
  const home = playerHome(state);
  if (!home) return err('err.notYours');
  const cost = amount * marketPrice(state, resource).buy;
  if (state.player.credits < cost) return err('err.credits');
  state.player.credits -= cost;
  if (resource === 'fuel') state.player.fuel += amount;
  else home[resource] += amount;
  return null;
}

export function sellResource(state: GameState, resource: Resource, amount: number): ActionResult {
  if (amount <= 0) return err('err.amount');
  const home = playerHome(state);
  if (!home) return err('err.notYours');
  const stock = resource === 'fuel' ? state.player.fuel : home[resource];
  if (stock < amount) return err('err.notEnoughStock');
  if (resource === 'fuel') state.player.fuel -= amount;
  else home[resource] -= amount;
  state.player.credits += amount * marketPrice(state, resource).sell;
  return null;
}

// ---------- Bygg och värva ----------

export function build(state: GameState, planetId: number, building: Building): ActionResult {
  const p = planet(state, planetId);
  if (p.owner !== 'player') return err('err.notYours');
  if (!p.habitable && !p.outpost) return err('err.needHabitable');
  if (building === 'farm' && !p.habitable) return err('err.noFarmsOnOutpost');
  const payErr = payAt(state, p, BUILDING_COSTS[building]);
  if (payErr) return payErr;
  if (building === 'mine') p.mines++;
  else if (building === 'farm') p.farms++;
  else if (building === 'solarSat') p.solarSats++;
  else p.defense++;
  return null;
}

export function buyShip(state: GameState, ship: keyof typeof SHIP_COSTS): ActionResult {
  const home = playerHome(state);
  if (!home) return err('err.notYours');
  const payErr = payAt(state, home, SHIP_COSTS[ship]);
  if (payErr) return payErr;
  if (ship === 'battleCruiser') state.player.battleCruisers++;
  else state.player.cargoCruisers++;
  return null;
}

export function trainTroops(state: GameState, planetId: number, count: number): ActionResult {
  const p = planet(state, planetId);
  if (p.owner !== 'player') return err('err.notYours');
  if (!p.habitable) return err('err.needHabitable');
  if (count <= 0) return err('err.amount');
  const popCost = Math.ceil(count / 1000);
  if (p.population - popCost < 100) return err('err.population');
  const payErr = payAt(state, p, {
    credits: count * TROOP_COST.credits,
    minerals: 0,
    energy: Math.ceil(count * TROOP_COST.energy),
  });
  if (payErr) return payErr;
  p.population -= popCost;
  p.troops += count;
  return null;
}

export function setTax(state: GameState, planetId: number, rate: number): ActionResult {
  const p = planet(state, planetId);
  if (p.owner !== 'player') return err('err.notYours');
  if (rate < 0 || rate > 100) return err('err.taxRange');
  p.taxRate = Math.round(rate);
  return null;
}

// ---------- Konvojer från hemplaneten ----------

function launchConvoy(
  state: GameState,
  targetId: number,
  kind: 'processor' | 'outpost' | 'probe',
): ActionResult {
  const home = playerHome(state);
  if (!home) return err('err.notYours');
  const target = planet(state, targetId);
  if (kind !== 'probe') {
    if (target.owner !== 'neutral') return err('err.notNeutral');
    if (target.terraformingBy) return err('err.alreadyTerraforming');
    if (state.missions.some((m) => m.toId === targetId && (m.type === 'processor' || m.type === 'outpost'))) {
      return err('err.alreadyIncoming');
    }
  } else if (target.owner !== 'enemy') {
    return err('err.targetEnemy');
  }
  const payErr = payAt(state, home, CONVOY_COSTS[kind]);
  if (payErr) return payErr;
  launch(state, { owner: 'player', type: kind, fromId: home.id, toId: targetId });
  if (kind === 'processor') {
    log(state, 'log.processorSent', { planet: target.name, days: state.missions.at(-1)!.daysLeft });
  } else if (kind === 'outpost') {
    log(state, 'log.outpostSent', { planet: target.name, days: state.missions.at(-1)!.daysLeft });
  }
  return null;
}

export const sendProcessor = (s: GameState, id: number): ActionResult => launchConvoy(s, id, 'processor');
export const sendOutpost = (s: GameState, id: number): ActionResult => launchConvoy(s, id, 'outpost');
export const sendProbe = (s: GameState, id: number): ActionResult => launchConvoy(s, id, 'probe');

// ---------- Flottuppdrag ----------

function reserveBattleCruisers(state: GameState, fromId: number, toId: number, cruisers: number): ActionResult {
  if (state.player.battleCruisers < cruisers) {
    return err('err.needBattleCruisers', { n: cruisers, have: state.player.battleCruisers });
  }
  const fuel = cruisers * fuelPerCruiser(fromId, toId);
  if (state.player.fuel < fuel) return err('err.needFuel', { n: fuel, have: state.player.fuel });
  state.player.battleCruisers -= cruisers;
  state.player.fuel -= fuel;
  return null;
}

/** Skicka trupper: till egen planet = förflyttning, till fiendens = invasion. */
export function sendTroops(state: GameState, fromId: number, toId: number, count: number): ActionResult {
  const from = planet(state, fromId);
  const to = planet(state, toId);
  if (from.owner !== 'player') return err('err.notYours');
  if (fromId === toId) return err('err.sameTarget');
  if (to.owner === 'neutral') return err('err.targetEnemy');
  if (count <= 0 || from.troops < count) return err('err.notEnoughTroops');
  const cruisers = Math.ceil(count / TROOPS_PER_CRUISER);
  const reserveErr = reserveBattleCruisers(state, fromId, toId, cruisers);
  if (reserveErr) return reserveErr;
  from.troops -= count;
  launch(state, {
    owner: 'player',
    type: to.owner === 'player' ? 'move' : 'invade',
    fromId,
    toId,
    troops: count,
    battleCruisers: cruisers,
  });
  return null;
}

export function sendCargo(
  state: GameState,
  fromId: number,
  toId: number,
  cargo: Record<LocalResource, number>,
): ActionResult {
  const from = planet(state, fromId);
  const to = planet(state, toId);
  if (from.owner !== 'player') return err('err.notYours');
  if (to.owner !== 'player') return err('err.targetOwn');
  if (fromId === toId) return err('err.sameTarget');
  const total = cargo.food + cargo.energy + cargo.minerals;
  if (total <= 0) return err('err.amount');
  if (cargo.food > from.food || cargo.energy > from.energy || cargo.minerals > from.minerals) {
    return err('err.notEnoughStock');
  }
  const cruisers = Math.ceil(total / CARGO_PER_CRUISER);
  if (state.player.cargoCruisers < cruisers) {
    return err('err.needCargoCruisers', { n: cruisers, have: state.player.cargoCruisers });
  }
  const fuel = cruisers * fuelPerCruiser(fromId, toId);
  if (state.player.fuel < fuel) return err('err.needFuel', { n: fuel, have: state.player.fuel });
  state.player.cargoCruisers -= cruisers;
  state.player.fuel -= fuel;
  from.food -= cargo.food;
  from.energy -= cargo.energy;
  from.minerals -= cargo.minerals;
  launch(state, { owner: 'player', type: 'cargo', fromId, toId, cargoCruisers: cruisers, cargo });
  return null;
}

export function bombard(state: GameState, targetId: number, cruisers: number): ActionResult {
  const home = playerHome(state);
  if (!home) return err('err.notYours');
  const target = planet(state, targetId);
  if (target.owner !== 'enemy') return err('err.targetEnemy');
  if (cruisers <= 0) return err('err.noCruisers');
  const reserveErr = reserveBattleCruisers(state, home.id, targetId, cruisers);
  if (reserveErr) return reserveErr;
  launch(state, { owner: 'player', type: 'bombard', fromId: home.id, toId: targetId, battleCruisers: cruisers });
  return null;
}

// ---------- Dagsväxling ----------

export function checkVictory(state: GameState): void {
  if (state.status !== 'playing') return;
  if (!homeOf(state, 'enemy')) {
    state.status = 'won';
    log(state, 'log.win', undefined, 'good');
  } else if (!homeOf(state, 'player')) {
    state.status = 'lost';
    log(state, 'log.lose', undefined, 'bad');
  }
}

function recordHistory(state: GameState): void {
  const troopsOf = (owner: 'player' | 'enemy') =>
    planetsOf(state, owner).reduce((sum, p) => sum + p.troops, 0) +
    state.missions.filter((m) => m.owner === owner).reduce((sum, m) => sum + m.troops, 0);
  state.history.push({
    day: state.day,
    playerCredits: state.player.credits,
    enemyCredits: state.enemy.credits,
    playerTroops: troopsOf('player'),
    enemyTroops: troopsOf('enemy'),
    playerPlanets: planetsOf(state, 'player').length,
    enemyPlanets: planetsOf(state, 'enemy').length,
  });
  if (state.history.length > 1000) state.history.splice(0, state.history.length - 1000);
}

export function endDay(state: GameState): void {
  if (state.status !== 'playing') return;
  state.day++;
  runMissions(state);
  checkVictory(state);
  if (state.status !== 'playing') return;
  runTerraforming(state);
  runEconomy(state, 'player');
  runEconomy(state, 'enemy');
  runEvents(state);
  enemyTurn(state);
  recordHistory(state);
  checkVictory(state);
}
