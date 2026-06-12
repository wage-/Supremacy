import { enemyTurn } from './ai';
import { resolveInvasion } from './combat';
import {
  BUILDING_COSTS,
  FUEL_PER_CRUISER_MISSION,
  MARKET,
  SHIP_COSTS,
  TERRAFORM_DAYS,
  TROOPS_PER_CRUISER,
  TROOP_COST,
  type Cost,
} from './data';
import { runEconomy, runTerraforming } from './economy';
import { homeOf, log } from './state';
import type { Building, GameState, Planet, Resource } from './types';

export type ActionResult = string | null; // error message, or null on success

function planet(state: GameState, id: number): Planet {
  const p = state.planets.find((x) => x.id === id);
  if (!p) throw new Error(`Okänd planet: ${id}`);
  return p;
}

function payPlayer(state: GameState, cost: Cost): ActionResult {
  const f = state.player;
  if (f.credits < cost.credits) return 'Inte tillräckligt med krediter.';
  if (f.minerals < cost.minerals) return 'Inte tillräckligt med mineraler.';
  if (f.energy < cost.energy) return 'Inte tillräckligt med energi.';
  f.credits -= cost.credits;
  f.minerals -= cost.minerals;
  f.energy -= cost.energy;
  return null;
}

export function buyResource(state: GameState, resource: Resource, amount: number): ActionResult {
  if (amount <= 0) return 'Ange en positiv mängd.';
  const cost = amount * MARKET[resource].buy;
  if (state.player.credits < cost) return 'Inte tillräckligt med krediter.';
  state.player.credits -= cost;
  state.player[resource] += amount;
  return null;
}

export function sellResource(state: GameState, resource: Resource, amount: number): ActionResult {
  if (amount <= 0) return 'Ange en positiv mängd.';
  if (state.player[resource] < amount) return 'Du har inte så mycket att sälja.';
  state.player[resource] -= amount;
  state.player.credits += amount * MARKET[resource].sell;
  return null;
}

export function build(state: GameState, planetId: number, building: Building): ActionResult {
  const p = planet(state, planetId);
  if (p.owner !== 'player') return 'Planeten tillhör inte dig.';
  if (!p.habitable) return 'Planeten måste terraformas först.';
  const err = payPlayer(state, BUILDING_COSTS[building]);
  if (err) return err;
  if (building === 'mine') p.mines++;
  else if (building === 'farm') p.farms++;
  else if (building === 'solarSat') p.solarSats++;
  else p.defense++;
  return null;
}

export function buyShip(state: GameState, ship: keyof typeof SHIP_COSTS): ActionResult {
  const err = payPlayer(state, SHIP_COSTS[ship]);
  if (err) return err;
  if (ship === 'battleCruiser') state.player.battleCruisers++;
  else state.player.atmosphereProcessors++;
  return null;
}

export function deployProcessor(state: GameState, planetId: number): ActionResult {
  const p = planet(state, planetId);
  if (state.player.atmosphereProcessors < 1) return 'Du har ingen atmosfärprocessor i lager.';
  if (p.owner !== 'neutral') return 'Planeten är inte neutral.';
  if (p.terraformingBy) return 'Planeten terraformas redan.';
  state.player.atmosphereProcessors--;
  p.terraformingBy = 'player';
  p.terraformDaysLeft = TERRAFORM_DAYS;
  log(state, `Atmosfärprocessor utplacerad på ${p.name} (${TERRAFORM_DAYS} dagar).`);
  return null;
}

export function setTax(state: GameState, planetId: number, rate: number): ActionResult {
  const p = planet(state, planetId);
  if (p.owner !== 'player') return 'Planeten tillhör inte dig.';
  if (rate < 0 || rate > 100) return 'Skatten måste vara 0–100 %.';
  p.taxRate = Math.round(rate);
  return null;
}

export function trainTroops(state: GameState, planetId: number, count: number): ActionResult {
  const p = planet(state, planetId);
  if (p.owner !== 'player') return 'Planeten tillhör inte dig.';
  if (count <= 0) return 'Ange ett positivt antal.';
  const popCost = Math.ceil(count / 1000);
  if (p.population - popCost < 100) return 'För liten befolkning för att värva fler.';
  const err = payPlayer(state, {
    credits: count * TROOP_COST.credits,
    minerals: 0,
    energy: Math.ceil(count * TROOP_COST.energy),
  });
  if (err) return err;
  p.population -= popCost;
  p.troops += count;
  return null;
}

function checkTransport(state: GameState, count: number): ActionResult {
  const cruisers = Math.ceil(count / TROOPS_PER_CRUISER);
  if (state.player.battleCruisers < cruisers)
    return `Kräver ${cruisers} stridskryssare (du har ${state.player.battleCruisers}).`;
  const fuel = cruisers * FUEL_PER_CRUISER_MISSION;
  if (state.player.fuel < fuel) return `Kräver ${fuel} bränsle (du har ${state.player.fuel}).`;
  state.player.fuel -= fuel;
  return null;
}

export function moveTroops(state: GameState, fromId: number, toId: number, count: number): ActionResult {
  const from = planet(state, fromId);
  const to = planet(state, toId);
  if (from.owner !== 'player' || to.owner !== 'player') return 'Båda planeterna måste vara dina.';
  if (fromId === toId) return 'Välj en annan destination.';
  if (count <= 0 || from.troops < count) return 'Så många trupper finns inte här.';
  const err = checkTransport(state, count);
  if (err) return err;
  from.troops -= count;
  to.troops += count;
  return null;
}

export function invade(state: GameState, fromId: number, targetId: number, count: number): ActionResult {
  const from = planet(state, fromId);
  const target = planet(state, targetId);
  if (from.owner !== 'player') return 'Anfallet måste utgå från en av dina planeter.';
  if (target.owner !== 'enemy') return 'Du kan bara invadera fiendens planeter.';
  if (count <= 0 || from.troops < count) return 'Så många trupper finns inte här.';
  const err = checkTransport(state, count);
  if (err) return err;
  from.troops -= count;
  resolveInvasion(state, target, 'player', count);
  checkVictory(state);
  return null;
}

export function checkVictory(state: GameState): void {
  if (state.status !== 'playing') return;
  if (!homeOf(state, 'enemy')) {
    state.status = 'won';
    log(state, 'Fiendens fäste har fallit. Systemet är ditt – SUPREMACY!', 'good');
  } else if (!homeOf(state, 'player')) {
    state.status = 'lost';
    log(state, 'Starbas har fallit. Ditt välde är över.', 'bad');
  }
}

export function endDay(state: GameState): void {
  if (state.status !== 'playing') return;
  state.day++;
  runTerraforming(state);
  runEconomy(state, 'player');
  runEconomy(state, 'enemy');
  enemyTurn(state);
  checkVictory(state);
}
