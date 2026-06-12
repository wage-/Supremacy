import type { AiPersonality, Building, Difficulty, Resource } from './types';

export const SAVE_VERSION = 2;

export interface Cost {
  credits: number;
  minerals: number;
  energy: number;
}

/** Mineraler och energi dras från planetens lokala lager. */
export const BUILDING_COSTS: Record<Building, Cost> = {
  mine: { credits: 800, minerals: 0, energy: 40 },
  farm: { credits: 600, minerals: 0, energy: 30 },
  solarSat: { credits: 500, minerals: 60, energy: 0 },
  defense: { credits: 1200, minerals: 120, energy: 60 },
};

/** Skepp byggs vid hemplaneten; mineraler/energi dras från dess lager. */
export const SHIP_COSTS = {
  battleCruiser: { credits: 2500, minerals: 300, energy: 100 },
  cargoCruiser: { credits: 1500, minerals: 150, energy: 50 },
} satisfies Record<string, Cost>;

/** Engångskonvojer: köps och avfyras i samma handling. */
export const CONVOY_COSTS = {
  processor: { credits: 4000, minerals: 500, energy: 200 },
  outpost: { credits: 2200, minerals: 250, energy: 80 },
  probe: { credits: 700, minerals: 0, energy: 0 },
} satisfies Record<string, Cost>;

/** Krediter + lokal energi per värvad soldat. */
export const TROOP_COST = { credits: 4, energy: 0.5 };

export const TROOPS_PER_CRUISER = 500;
export const CARGO_PER_CRUISER = 500;
export const TERRAFORM_DAYS = 12;
export const PROBE_INTEL_DAYS = 30;

/** Restid i dagar mellan två omloppsbanor (planet-id = bana). */
export function travelDays(fromId: number, toId: number): number {
  return 1 + Math.ceil(Math.abs(fromId - toId) / 3);
}

/** Bränsle per kryssare för en resa. */
export function fuelPerCruiser(fromId: number, toId: number): number {
  return 10 + 5 * Math.abs(fromId - toId);
}

/** Marknadspriser per enhet: vad spelaren betalar / får. */
export const MARKET: Record<Resource, { buy: number; sell: number }> = {
  food: { buy: 4, sell: 2 },
  energy: { buy: 6, sell: 3 },
  minerals: { buy: 8, sell: 4 },
  fuel: { buy: 10, sell: 5 },
};

export const PRODUCTION = {
  minePerDay: 8,
  farmPerDay: 20,
  solarSatPerDay: 14,
  mineEnergyUpkeep: 2,
  farmEnergyUpkeep: 1,
  foodPerPopulation: 0.015,
  foodPerTroop: 0.01,
  creditUpkeepPerTroop: 0.06,
  taxCreditFactor: 0.8,
  populationGrowthRate: 0.003,
  starvationShrinkRate: 0.01,
  /** Andel av truppstyrkan som deserterar per dag utan mat (utposter). */
  desertionRate: 0.02,
};

/** Varje laserbatteri förstör ungefär så här många anfallare. */
export const LASER_KILLS = 80;
/** Försvarare slåss hårdare på hemmaplan. */
export const DEFENDER_BONUS = 1.25;

/** Bombardemang: utslagna trupper per kryssare och chans att slå ut batterier. */
export const BOMBARD = {
  troopsKilledPerCruiser: 40,
  defenseKillChancePerCruiser: 0.25,
  cruiserLossPerDefense: 0.08,
};

export const EVENT_CHANCE_PER_DAY = 0.08;

export interface SystemDef {
  /** Egennamn; visas via i18n-mallen ui.systemName. */
  name: string;
  /** Fiendens hemfäste (egennamn). */
  fortress: string;
  planetCount: number;
  /** Abstrakt extrainkomst för AI:n per dag. */
  aiIncome: number;
  /** Sannolikhet per dag att AI:n överväger en invasion. */
  aiAggression: number;
  /** Multiplikator på AI:ns startresurser. */
  aiStartBoost: number;
  /** AI:n invaderar aldrig före denna dag — spelarens frist. */
  aiFirstStrikeDay: number;
  /** AI:n slutar värva när hemgarnisonen når detta tak. */
  aiGarrisonCap: number;
}

export const SYSTEMS: Record<Difficulty, SystemDef> = {
  0: { name: 'Yottha', fortress: 'Krath', planetCount: 8, aiIncome: 150, aiAggression: 0.1, aiStartBoost: 1.0, aiFirstStrikeDay: 45, aiGarrisonCap: 2500 },
  1: { name: 'Solus', fortress: 'Zorhal', planetCount: 9, aiIncome: 300, aiAggression: 0.2, aiStartBoost: 1.3, aiFirstStrikeDay: 35, aiGarrisonCap: 4000 },
  2: { name: 'Korr', fortress: 'Vekkar', planetCount: 10, aiIncome: 500, aiAggression: 0.3, aiStartBoost: 1.7, aiFirstStrikeDay: 28, aiGarrisonCap: 6000 },
  3: { name: 'Mortis', fortress: 'Qorrth', planetCount: 12, aiIncome: 800, aiAggression: 0.4, aiStartBoost: 2.2, aiFirstStrikeDay: 22, aiGarrisonCap: 9000 },
};

/** Hur personligheten förskjuter AI:ns beteende. */
export const PERSONALITIES: Record<
  AiPersonality,
  { aggression: number; income: number; garrisonCap: number; expandChance: number; firstStrikeShift: number }
> = {
  aggressor: { aggression: 1.6, income: 1.0, garrisonCap: 1.1, expandChance: 0.2, firstStrikeShift: -8 },
  economist: { aggression: 0.7, income: 1.35, garrisonCap: 1.2, expandChance: 0.3, firstStrikeShift: 8 },
  expander: { aggression: 0.9, income: 1.0, garrisonCap: 1.0, expandChance: 0.5, firstStrikeShift: 0 },
};

export const PLANET_NAMES = [
  'Arcturus', 'Vega', 'Altair', 'Rigel', 'Castor', 'Pollux',
  'Mira', 'Deneb', 'Spica', 'Capella', 'Antares', 'Talos',
];
