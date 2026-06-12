// Ad-hoc balance simulation (not part of the game).
import * as game from './src/game/game';
import { newGame, homeOf, planetsOf } from './src/game/state';
import { LASER_KILLS, TROOPS_PER_CRUISER } from './src/game/data';
import type { Difficulty, GameState, Resource } from './src/game/types';

function ensure(s: GameState, res: Resource, amount: number, creditFloor: number): void {
  if (s.player[res] < amount && s.player.credits > creditFloor) {
    game.buyResource(s, res, amount - s.player[res]);
  }
}

function playGreedy(difficulty: Difficulty, seed: number, maxDays = 500) {
  const s = newGame(difficulty, seed);

  while (s.status === 'playing' && s.day < maxDays) {
    const home = homeOf(s, 'player');
    if (!home) break;

    ensure(s, 'food', 300, 1500);
    ensure(s, 'energy', 150, 2500);

    const mine = planetsOf(s, 'player');
    const neutrals = s.planets.filter((p) => p.owner === 'neutral' && !p.terraformingBy);
    const expanding = neutrals.length > 0 && mine.length < 5;

    // Economy on every owned planet.
    for (const p of mine) {
      if (p.farms < 5 && s.player.credits > 3000) game.build(s, p.id, 'farm');
      if (p.solarSats < 5 && s.player.credits > 3000) game.build(s, p.id, 'solarSat');
      if (p.mines < 4 && s.player.credits > 3500) game.build(s, p.id, 'mine');
      if (p.defense < (p.isHome ? 3 : 2) && s.player.credits > (expanding ? 9000 : 6000)) {
        game.build(s, p.id, 'defense');
      }
    }

    if (expanding) {
      // Expansion phase: colonies before armies.
      if (s.player.atmosphereProcessors > 0) {
        game.deployProcessor(s, neutrals[0].id);
      } else if (s.player.credits > 5000) {
        ensure(s, 'minerals', 500, 4500);
        ensure(s, 'energy', 200, 4500);
        game.buyShip(s, 'atmosphereProcessor');
      }
      if (home.troops < 1500 && s.player.credits > 2500) {
        ensure(s, 'energy', 200, 2000);
        game.trainTroops(s, home.id, 200);
      }
    } else {
      // War phase: size the strike force off the enemy fortress.
      const enemyHome = homeOf(s, 'enemy');
      if (enemyHome) {
        const needed = Math.ceil(
          ((enemyHome.troops + enemyHome.defense * LASER_KILLS) * 1.6) / 100,
        ) * 100;
        const cruisersNeeded = Math.ceil(needed / TROOPS_PER_CRUISER);

        if (home.troops < needed + 300 && s.player.credits > 2500) {
          ensure(s, 'energy', 300, 2000);
          game.trainTroops(s, home.id, 300);
        }
        if (s.player.battleCruisers < cruisersNeeded && s.player.credits > 3500) {
          ensure(s, 'minerals', 300, 3000);
          game.buyShip(s, 'battleCruiser');
        }
        if (home.troops >= needed && s.player.battleCruisers >= cruisersNeeded) {
          ensure(s, 'fuel', cruisersNeeded * 40, 0);
          game.invade(s, home.id, enemyHome.id, needed);
        }
      }
    }

    game.endDay(s);
  }

  const invasions = s.log.filter((l) => l.text.includes('Fiendens styrkor')).length;
  return {
    difficulty,
    seed,
    status: s.status,
    day: s.day,
    enemyInvasions: invasions,
    playerPlanets: planetsOf(s, 'player').length,
  };
}

for (const d of [0, 1, 2, 3] as Difficulty[]) {
  for (const seed of [1, 2, 3, 4]) {
    console.log(JSON.stringify(playGreedy(d, seed)));
  }
}
