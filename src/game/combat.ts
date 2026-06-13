import { BOMBARD, DEFENDER_BONUS, LASER_KILLS, TROOPS_PER_CRUISER } from './data';
import { rand, randRange } from './rng';
import { factionOf, log } from './state';
import type { BattleReport, GameState, Owner, Planet } from './types';

/**
 * Avgör en invasion av `planet` av `attacker` med `troopsSent` soldater.
 * Muterar planeten och returnerar en rapport. Anroparen har redan dragit
 * trupper och bränsle; kryssarna återlämnas av uppdragssystemet.
 */
export function resolveInvasion(
  state: GameState,
  planet: Planet,
  attacker: Owner,
  troopsSent: number,
): BattleReport {
  const lasersDestroyed = Math.min(
    troopsSent,
    Math.round(planet.defense * LASER_KILLS * randRange(state, 0.8, 1.2)),
  );
  const landed = troopsSent - lasersDestroyed;

  const attackPower = landed * randRange(state, 0.85, 1.15);
  const defendPower = planet.troops * DEFENDER_BONUS * randRange(state, 0.85, 1.15);

  let report: BattleReport;
  if (landed > 0 && attackPower > defendPower) {
    const survivors = Math.max(1, Math.round(landed * (1 - defendPower / attackPower)));
    report = {
      attackerWins: true,
      attackersSent: troopsSent,
      attackersLost: troopsSent - survivors,
      defendersLost: planet.troops,
      lasersDestroyed,
    };
    planet.owner = attacker;
    planet.troops = survivors;
    planet.terraformingBy = null;
    planet.terraformDaysLeft = 0;
    planet.scoutedUntil = 0;
    if (planet.habitable) {
      planet.morale = Math.min(planet.morale, 40);
      planet.population = Math.round(planet.population * 0.95);
    }
  } else {
    const ratio = defendPower > 0 ? Math.min(1, attackPower / defendPower) : 0;
    const defendersLost = Math.round(planet.troops * ratio * 0.8);
    planet.troops -= defendersLost;
    report = {
      attackerWins: false,
      attackersSent: troopsSent,
      attackersLost: troopsSent,
      defendersLost,
      lasersDestroyed,
    };
  }

  const params = {
    planet: planet.name,
    lostA: report.attackersLost,
    lostD: report.defendersLost,
  };
  if (attacker === 'player') {
    log(
      state,
      report.attackerWins ? 'log.invasionWonPlayer' : 'log.invasionLostPlayer',
      params,
      report.attackerWins ? 'good' : 'bad',
    );
  } else {
    log(
      state,
      report.attackerWins ? 'log.invasionWonEnemy' : 'log.invasionRepelled',
      params,
      report.attackerWins ? 'bad' : 'good',
    );
  }

  return report;
}

/** Andel kryssare som går förlorade tillsammans med fallna trupper. */
export function cruiserLosses(report: BattleReport): number {
  const used = Math.ceil(report.attackersSent / TROOPS_PER_CRUISER);
  const lostFraction = report.attackersLost / Math.max(1, report.attackersSent);
  return Math.floor(used * lostFraction * 0.5);
}

/** Orbitalt bombardemang: kryssare beskjuter försvar och garnison. */
export function resolveBombardment(
  state: GameState,
  planet: Planet,
  attacker: Owner,
  cruisers: number,
): { defenseDestroyed: number; troopsKilled: number; cruisersLost: number } {
  let defenseDestroyed = 0;
  for (let i = 0; i < cruisers && planet.defense - defenseDestroyed > 0; i++) {
    if (rand(state) < BOMBARD.defenseKillChancePerCruiser) defenseDestroyed++;
  }
  const troopsKilled = Math.min(
    planet.troops,
    Math.round(cruisers * BOMBARD.troopsKilledPerCruiser * randRange(state, 0.7, 1.3)),
  );
  const cruisersLost = Math.min(
    cruisers,
    Math.round(planet.defense * BOMBARD.cruiserLossPerDefense * cruisers * rand(state)),
  );

  planet.defense -= defenseDestroyed;
  planet.troops -= troopsKilled;
  const survivors = cruisers - cruisersLost;
  factionOf(state, attacker).battleCruisers += survivors;

  const params = { planet: planet.name, defenseDestroyed, troopsKilled, cruisersLost };
  if (attacker === 'player') log(state, 'log.bombardment', params, 'good');
  else log(state, 'log.bombardmentEnemy', params, 'bad');

  return { defenseDestroyed, troopsKilled, cruisersLost };
}
