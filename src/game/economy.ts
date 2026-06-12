import { PRODUCTION } from './data';
import { factionOf, log, planetsOf } from './state';
import type { GameState, LocalResource, Owner, Planet } from './types';

/**
 * Spelarens resurser lagras lokalt per planet; AI:n spelar med en samlad
 * pott (klassiskt AI-fusk — osynligt bakom krigsdimman och mycket enklare).
 */
function stocks(state: GameState, owner: Owner, planet: Planet) {
  if (owner === 'player') {
    return {
      get: (r: LocalResource) => planet[r],
      add: (r: LocalResource, n: number) => (planet[r] = Math.max(0, planet[r] + n)),
    };
  }
  const f = factionOf(state, owner);
  const key = { food: 'pooledFood', energy: 'pooledEnergy', minerals: 'pooledMinerals' } as const;
  return {
    get: (r: LocalResource) => f[key[r]],
    add: (r: LocalResource, n: number) => (f[key[r]] = Math.max(0, f[key[r]] + n)),
  };
}

/** Kör en dags produktion, konsumtion, skatt och tillväxt för en fraktion. */
export function runEconomy(state: GameState, owner: Owner): void {
  const faction = factionOf(state, owner);

  for (const planet of planetsOf(state, owner)) {
    const s = stocks(state, owner, planet);

    s.add('energy', Math.round(planet.solarSats * PRODUCTION.solarSatPerDay * planet.solarFlux));

    const mineUpkeep = planet.mines * PRODUCTION.mineEnergyUpkeep;
    const farmUpkeep = planet.farms * PRODUCTION.farmEnergyUpkeep;
    if (s.get('energy') >= mineUpkeep) {
      s.add('energy', -mineUpkeep);
      s.add('minerals', Math.round(planet.mines * PRODUCTION.minePerDay * planet.mineralRichness));
    }
    if (s.get('energy') >= farmUpkeep) {
      s.add('energy', -farmUpkeep);
      s.add('food', Math.round(planet.farms * PRODUCTION.farmPerDay * planet.fertility));
    }

    // Trupper äter lokalt — även på utposter.
    if (planet.troops > 0) {
      const troopFood = Math.round(planet.troops * PRODUCTION.foodPerTroop);
      if (s.get('food') >= troopFood) {
        s.add('food', -troopFood);
      } else {
        s.add('food', -s.get('food'));
        const deserters = Math.ceil(planet.troops * PRODUCTION.desertionRate);
        planet.troops = Math.max(0, planet.troops - deserters);
        if (owner === 'player') log(state, 'log.desertion', { planet: planet.name }, 'bad');
      }
      faction.credits = Math.max(
        0,
        faction.credits - Math.round(planet.troops * PRODUCTION.creditUpkeepPerTroop),
      );
    }

    if (!planet.habitable) continue;

    const popFood = Math.round(planet.population * PRODUCTION.foodPerPopulation);
    if (s.get('food') >= popFood) {
      s.add('food', -popFood);
      const growthFactor = planet.morale / 100;
      planet.population += Math.max(
        0,
        Math.round(planet.population * PRODUCTION.populationGrowthRate * growthFactor),
      );
    } else {
      s.add('food', -s.get('food'));
      planet.population = Math.max(
        0,
        planet.population - Math.ceil(planet.population * PRODUCTION.starvationShrinkRate),
      );
      planet.morale = Math.max(0, planet.morale - 5);
      if (owner === 'player') log(state, 'log.starvation', { planet: planet.name }, 'bad');
    }

    faction.credits += Math.round(
      planet.population * (planet.taxRate / 100) * PRODUCTION.taxCreditFactor * (planet.morale / 100),
    );

    const moraleTarget = Math.max(0, Math.min(100, 100 - planet.taxRate * 1.2));
    if (planet.morale < moraleTarget) planet.morale = Math.min(moraleTarget, planet.morale + 2);
    else if (planet.morale > moraleTarget) planet.morale = Math.max(moraleTarget, planet.morale - 2);
  }
}

/** Räkna ner aktiva atmosfärprocessorer; kolonisera färdiga världar. */
export function runTerraforming(state: GameState): void {
  for (const planet of state.planets) {
    if (planet.terraformDaysLeft <= 0 || !planet.terraformingBy) continue;
    planet.terraformDaysLeft--;
    if (planet.terraformDaysLeft > 0) continue;

    const newOwner = planet.terraformingBy;
    planet.owner = newOwner;
    planet.terraformingBy = null;
    planet.habitable = true;
    planet.outpost = false;
    planet.population = 300;
    planet.morale = 70;
    planet.taxRate = 25;
    if (newOwner === 'player') {
      planet.food = 100;
      planet.energy = 50;
      log(state, 'log.colonised', { planet: planet.name }, 'good');
    } else {
      log(state, 'log.colonisedEnemy', { planet: planet.name }, 'bad');
    }
  }
}
