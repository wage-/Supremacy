import type { Building, Difficulty, Resource } from './types';

export interface Cost {
  credits: number;
  minerals: number;
  energy: number;
}

export const BUILDING_COSTS: Record<Building, Cost> = {
  mine: { credits: 800, minerals: 0, energy: 40 },
  farm: { credits: 600, minerals: 0, energy: 30 },
  solarSat: { credits: 500, minerals: 60, energy: 0 },
  defense: { credits: 1200, minerals: 120, energy: 60 },
};

export const SHIP_COSTS = {
  battleCruiser: { credits: 2500, minerals: 300, energy: 100 },
  atmosphereProcessor: { credits: 4000, minerals: 500, energy: 200 },
} satisfies Record<string, Cost>;

/** Credits + energy per trained soldier. */
export const TROOP_COST = { credits: 4, energy: 0.5 };

export const TROOPS_PER_CRUISER = 500;
export const FUEL_PER_CRUISER_MISSION = 40;
export const TERRAFORM_DAYS = 12;

/** Market prices per unit: what the player pays / receives. */
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
  creditUpkeepPerTroop: 0.1,
  taxCreditFactor: 0.8,
  populationGrowthRate: 0.003,
  starvationShrinkRate: 0.01,
};

/** Each laser battery destroys roughly this many attackers. */
export const LASER_KILLS = 80;
/** Defenders fight harder on home ground. */
export const DEFENDER_BONUS = 1.25;

export interface SystemDef {
  name: string;
  label: string;
  opponent: string;
  planetCount: number;
  /** Abstract extra income the AI receives per day. */
  aiIncome: number;
  /** Probability per day that the AI considers launching an invasion. */
  aiAggression: number;
  /** Multiplier on the AI's starting resources. */
  aiStartBoost: number;
  /** The AI never invades before this day — the player's grace period. */
  aiFirstStrikeDay: number;
  /** The AI stops training troops once its home garrison reaches this size. */
  aiGarrisonCap: number;
}

export const SYSTEMS: Record<Difficulty, SystemDef> = {
  0: { name: 'Yottha-systemet', label: 'Lätt', opponent: 'General Hraak', planetCount: 8, aiIncome: 150, aiAggression: 0.1, aiStartBoost: 1.0, aiFirstStrikeDay: 45, aiGarrisonCap: 2500 },
  1: { name: 'Solus-systemet', label: 'Normal', opponent: 'Övermästare Zorn', planetCount: 9, aiIncome: 300, aiAggression: 0.2, aiStartBoost: 1.3, aiFirstStrikeDay: 35, aiGarrisonCap: 4000 },
  2: { name: 'Korr-systemet', label: 'Svår', opponent: 'Kejsar Vekk', planetCount: 10, aiIncome: 500, aiAggression: 0.3, aiStartBoost: 1.7, aiFirstStrikeDay: 28, aiGarrisonCap: 6000 },
  3: { name: 'Mortis-systemet', label: 'Omöjlig', opponent: 'Hivemind Qor', planetCount: 12, aiIncome: 800, aiAggression: 0.4, aiStartBoost: 2.2, aiFirstStrikeDay: 22, aiGarrisonCap: 9000 },
};

export const PLANET_NAMES = [
  'Arcturus', 'Vega', 'Altair', 'Rigel', 'Castor', 'Pollux',
  'Mira', 'Deneb', 'Spica', 'Capella', 'Antares', 'Talos',
];
