import { PRODUCTION } from './data';
import { factionOf, log, planetsOf } from './state';
import type { GameState, Owner, Planet } from './types';

/** Run one day of production, consumption, taxes and growth for one faction. */
export function runEconomy(state: GameState, owner: Owner): void {
  const faction = factionOf(state, owner);

  for (const planet of planetsOf(state, owner)) {
    faction.energy += Math.round(planet.solarSats * PRODUCTION.solarSatPerDay * planet.solarFlux);

    const mineUpkeep = planet.mines * PRODUCTION.mineEnergyUpkeep;
    const farmUpkeep = planet.farms * PRODUCTION.farmEnergyUpkeep;
    if (faction.energy >= mineUpkeep) {
      faction.energy -= mineUpkeep;
      faction.minerals += Math.round(planet.mines * PRODUCTION.minePerDay * planet.mineralRichness);
    }
    if (faction.energy >= farmUpkeep) {
      faction.energy -= farmUpkeep;
      faction.food += Math.round(planet.farms * PRODUCTION.farmPerDay * planet.fertility);
    }

    if (!planet.habitable) continue;

    const foodNeed = Math.round(
      planet.population * PRODUCTION.foodPerPopulation + planet.troops * PRODUCTION.foodPerTroop,
    );
    if (faction.food >= foodNeed) {
      faction.food -= foodNeed;
      const growthFactor = planet.morale / 100;
      planet.population += Math.max(
        0,
        Math.round(planet.population * PRODUCTION.populationGrowthRate * growthFactor),
      );
    } else {
      faction.food = 0;
      planet.population = Math.max(
        0,
        planet.population - Math.ceil(planet.population * PRODUCTION.starvationShrinkRate),
      );
      planet.morale = Math.max(0, planet.morale - 5);
      if (owner === 'player') {
        log(state, `Svält på ${planet.name}! Befolkningen minskar.`, 'bad');
      }
    }

    faction.credits += Math.round(
      planet.population * (planet.taxRate / 100) * PRODUCTION.taxCreditFactor * (planet.morale / 100),
    );
    faction.credits = Math.max(
      0,
      faction.credits - Math.round(planet.troops * PRODUCTION.creditUpkeepPerTroop),
    );

    const moraleTarget = Math.max(0, Math.min(100, 100 - planet.taxRate * 1.2));
    if (planet.morale < moraleTarget) planet.morale = Math.min(moraleTarget, planet.morale + 2);
    else if (planet.morale > moraleTarget) planet.morale = Math.max(moraleTarget, planet.morale - 2);
  }
}

/** Advance all active atmosphere processors by one day; colonise finished worlds. */
export function runTerraforming(state: GameState): void {
  for (const planet of state.planets) {
    if (planet.terraformDaysLeft <= 0 || !planet.terraformingBy) continue;
    planet.terraformDaysLeft--;
    if (planet.terraformDaysLeft > 0) continue;

    const newOwner = planet.terraformingBy;
    planet.owner = newOwner;
    planet.terraformingBy = null;
    planet.habitable = true;
    planet.population = 300;
    planet.morale = 70;
    planet.taxRate = 25;
    log(
      state,
      newOwner === 'player'
        ? `${planet.name} är terraformad! Kolonister har landat.`
        : `Fienden har koloniserat ${planet.name}.`,
      newOwner === 'player' ? 'good' : 'bad',
    );
  }
}

export function colonisedPlanet(planet: Planet): boolean {
  return planet.habitable && planet.owner !== 'neutral';
}
