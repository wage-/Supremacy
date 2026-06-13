// Fristående balanssimulering (ingår inte i spelet): npx vite-node sim.ts
import * as game from './src/game/game';
import { newGame, homeOf, planetsOf } from './src/game/state';
import { LASER_KILLS, TROOPS_PER_CRUISER, fuelPerCruiser, travelDays } from './src/game/data';
import type { Difficulty, GameState, Planet, Resource } from './src/game/types';

function ensureHome(s: GameState, home: Planet, res: Resource, amount: number, floor: number): void {
  const stock = res === 'fuel' ? s.player.fuel : home[res as 'food' | 'energy' | 'minerals'];
  if (stock < amount && s.player.credits > floor) {
    game.buyResource(s, res, amount - stock);
  }
}

function playGreedy(difficulty: Difficulty, seed: number, maxDays = 500) {
  const s = newGame(difficulty, seed);

  while (s.status === 'playing' && s.day < maxDays) {
    const home = homeOf(s, 'player');
    if (!home) break;

    ensureHome(s, home, 'food', 300, 1500);
    ensureHome(s, home, 'energy', 150, 2500);

    // Hemmaekonomi.
    if (home.farms < 5 && s.player.credits > 3000) game.build(s, home.id, 'farm');
    if (home.solarSats < 5 && s.player.credits > 3000) game.build(s, home.id, 'solarSat');
    if (home.mines < 4 && s.player.credits > 3500) game.build(s, home.id, 'mine');
    if (home.defense < 3 && s.player.credits > 6000) {
      ensureHome(s, home, 'minerals', 150, 5000);
      game.build(s, home.id, 'defense');
    }

    // Försörj och bygg ut kolonier/utposter.
    for (const p of planetsOf(s, 'player')) {
      if (p.isHome) continue;
      const hasCargoEnRoute = s.missions.some((m) => m.type === 'cargo' && m.toId === p.id);
      if (!hasCargoEnRoute && (p.minerals < 80 || p.energy < 60 || (p.troops > 0 && p.food < 50))) {
        if (s.player.cargoCruisers < 1 && s.player.credits > 3000) game.buyShip(s, 'cargoCruiser');
        ensureHome(s, home, 'minerals', 250, 2500);
        ensureHome(s, home, 'energy', 300, 2500);
        ensureHome(s, home, 'fuel', 100, 2000);
        game.sendCargo(s, home.id, p.id, {
          food: Math.min(150, home.food),
          energy: Math.min(150, Math.max(0, home.energy - 100)),
          minerals: Math.min(150, Math.max(0, home.minerals - 100)),
        });
      }
      if (p.habitable && p.farms < 4 && s.player.credits > 3000) game.build(s, p.id, 'farm');
      if (p.solarSats < 4 && s.player.credits > 3000) game.build(s, p.id, 'solarSat');
      if (p.mines < (p.outpost ? 5 : 3) && s.player.credits > 3000) game.build(s, p.id, 'mine');
    }

    // Expansion.
    const neutrals = s.planets.filter(
      (p) =>
        p.owner === 'neutral' &&
        !p.terraformingBy &&
        !s.missions.some((m) => m.toId === p.id && (m.type === 'processor' || m.type === 'outpost')),
    );
    if (neutrals.length > 0 && planetsOf(s, 'player').length < 5 && s.player.credits > 4500) {
      const target = neutrals[0];
      ensureHome(s, home, 'minerals', 520, 4000);
      ensureHome(s, home, 'energy', 220, 4000);
      if (target.mineralRichness > target.fertility && target.mineralRichness > 1) {
        game.sendOutpost(s, target.id);
      } else {
        game.sendProcessor(s, target.id);
      }
    }

    // Garnisonera kolonier och utposter så att AI:n inte tar dem gratis.
    for (const p of planetsOf(s, 'player')) {
      if (p.isHome || p.troops >= 200 || home.troops < 1500) continue;
      if (s.missions.some((m) => m.type === 'move' && m.toId === p.id)) continue;
      ensureHome(s, home, 'fuel', fuelPerCruiser(home.id, p.id), 1500);
      game.sendTroops(s, home.id, p.id, 300);
    }

    // Krigsfas: anfall svagaste fiendeplaneten; dimensionera med marginal för
    // restid (garnisonen hinner växa). Simulatorn tjuvkikar på styrkorna.
    const enemyPlanets = planetsOf(s, 'enemy');
    if (enemyPlanets.length > 0) {
      const strength = (p: Planet) => p.troops + p.defense * LASER_KILLS;
      const target = enemyPlanets.reduce((a, b) => (strength(b) < strength(a) ? b : a));
      const growth = target.isHome ? 120 * travelDays(home.id, target.id) : 0;
      const needed = Math.ceil((strength(target) * 1.7 + growth) / 100) * 100;
      const cruisersNeeded = Math.ceil(needed / TROOPS_PER_CRUISER);
      const invasionEnRoute = s.missions.some((m) => m.owner === 'player' && m.type === 'invade');

      if (!invasionEnRoute) {
        // Mjuka upp målet med bombardemang medan armén byggs.
        const bombardEnRoute = s.missions.some((m) => m.owner === 'player' && m.type === 'bombard');
        if (
          !bombardEnRoute &&
          home.troops < needed &&
          target.troops > 2000 &&
          s.player.battleCruisers >= 8 &&
          s.player.credits > 4000
        ) {
          ensureHome(s, home, 'fuel', 8 * fuelPerCruiser(home.id, target.id), 2000);
          game.bombard(s, target.id, 6);
        }
        if (home.troops < needed + 500 && s.player.credits > 2500) {
          ensureHome(s, home, 'energy', 300, 2000);
          game.trainTroops(s, home.id, 300);
        }
        if (s.player.battleCruisers < cruisersNeeded && s.player.credits > 3500) {
          ensureHome(s, home, 'minerals', 350, 3000);
          ensureHome(s, home, 'energy', 150, 3000);
          game.buyShip(s, 'battleCruiser');
        }
        if (home.troops >= needed + 400 && s.player.battleCruisers >= cruisersNeeded) {
          ensureHome(s, home, 'fuel', cruisersNeeded * fuelPerCruiser(home.id, target.id), 0);
          game.sendTroops(s, home.id, target.id, needed);
        }
      }
    }

    game.endDay(s);
  }

  const invasions = s.log.filter((l) => l.key === 'log.invasionWonEnemy' || l.key === 'log.invasionRepelled').length;
  return {
    difficulty,
    seed,
    status: s.status,
    day: s.day,
    personality: s.personality,
    enemyInvasions: invasions,
    playerPlanets: planetsOf(s, 'player').length,
  };
}

for (const d of [0, 1, 2, 3] as Difficulty[]) {
  for (const seed of [1, 2, 3, 4]) {
    console.log(JSON.stringify(playGreedy(d, seed)));
  }
}
