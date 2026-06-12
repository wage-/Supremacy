import { EVENT_CHANCE_PER_DAY, MARKET } from './data';
import { rand, randRange } from './rng';
import { coloniesOf, log, planetsOf } from './state';
import type { GameState, Resource } from './types';

/** Aktuellt marknadspris med eventuella händelsefaktorer. */
export function marketPrice(state: GameState, resource: Resource): { buy: number; sell: number } {
  const base = MARKET[resource];
  const swing = state.marketSwings[resource];
  const f = swing ? swing.factor : 1;
  return { buy: Math.max(1, Math.round(base.buy * f)), sell: Math.max(1, Math.round(base.sell * f)) };
}

function pick<T>(state: GameState, items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rand(state) * items.length)];
}

/** En dags slumphändelser. Mest motgångar, någon gång tur. */
export function runEvents(state: GameState): void {
  // Räkna ner pågående marknadssvängningar.
  for (const res of Object.keys(state.marketSwings) as Resource[]) {
    const swing = state.marketSwings[res]!;
    swing.daysLeft--;
    if (swing.daysLeft <= 0) delete state.marketSwings[res];
  }

  if (rand(state) >= EVENT_CHANCE_PER_DAY) return;

  const roll = rand(state);
  if (roll < 0.2) {
    // Pirater plundrar statskassan.
    const stolen = Math.round(state.player.credits * randRange(state, 0.04, 0.1));
    if (stolen > 0) {
      state.player.credits -= stolen;
      log(state, 'log.event.pirates', { credits: stolen }, 'bad');
    }
  } else if (roll < 0.4) {
    // Solstorm slår ut satelliter.
    const target = pick(state, planetsOf(state, 'player').filter((p) => p.solarSats > 0));
    if (target) {
      const lost = Math.min(target.solarSats, 1 + Math.floor(rand(state) * 2));
      target.solarSats -= lost;
      log(state, 'log.event.solarStorm', { planet: target.name, sats: lost }, 'bad');
    }
  } else if (roll < 0.55) {
    // Epidemi på en koloni.
    const target = pick(state, coloniesOf(state, 'player'));
    if (target) {
      target.population = Math.round(target.population * 0.92);
      target.morale = Math.max(0, target.morale - 10);
      log(state, 'log.event.epidemic', { planet: target.name }, 'bad');
    }
  } else if (roll < 0.75) {
    // Mineralfynd — något positivt.
    const target = pick(state, planetsOf(state, 'player').filter((p) => p.mines > 0));
    if (target) {
      const amount = Math.round(randRange(state, 150, 400));
      target.minerals += amount;
      log(state, 'log.event.mineralStrike', { planet: target.name, amount }, 'good');
    }
  } else {
    // Marknadssvängning på en slumpad resurs.
    const res = pick(state, ['food', 'energy', 'minerals', 'fuel'] as Resource[])!;
    const up = rand(state) < 0.5;
    state.marketSwings[res] = {
      factor: up ? randRange(state, 1.3, 1.6) : randRange(state, 0.5, 0.75),
      daysLeft: Math.round(randRange(state, 6, 12)),
    };
    log(state, up ? 'log.event.marketUp' : 'log.event.marketDown', { resource: `@res.${res}` });
  }
}
