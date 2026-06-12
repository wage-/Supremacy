import { DEFENDER_BONUS, LASER_KILLS, TROOPS_PER_CRUISER } from './data';
import { randRange } from './rng';
import { factionOf, log } from './state';
import type { BattleReport, GameState, Owner, Planet } from './types';

/**
 * Resolve an invasion of `planet` by `attacker` with `troopsSent` soldiers.
 * Mutates the planet (and the attacker's cruiser fleet) and returns a report.
 * The caller is responsible for having already deducted troops and fuel.
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

  // Some transport capacity is lost along with fallen troops.
  const fleet = factionOf(state, attacker);
  const cruisersUsed = Math.ceil(troopsSent / TROOPS_PER_CRUISER);
  const lostFraction = report.attackersLost / Math.max(1, troopsSent);
  const cruisersLost = Math.min(fleet.battleCruisers, Math.floor(cruisersUsed * lostFraction * 0.5));
  fleet.battleCruisers -= cruisersLost;

  const who = attacker === 'player' ? 'Dina styrkor' : 'Fiendens styrkor';
  log(
    state,
    `${who} anföll ${planet.name}: ${report.attackerWins ? 'planeten erövrad' : 'anfallet slogs tillbaka'} ` +
      `(anfallare förlorade ${report.attackersLost}, försvarare ${report.defendersLost}).`,
    report.attackerWins === (attacker === 'player') ? 'good' : 'bad',
  );

  return report;
}
