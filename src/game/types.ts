export type Owner = 'player' | 'enemy' | 'neutral';

export type Resource = 'food' | 'energy' | 'minerals' | 'fuel';

export type Building = 'mine' | 'farm' | 'solarSat' | 'defense';

export type Difficulty = 0 | 1 | 2 | 3;

export interface Planet {
  id: number;
  name: string;
  owner: Owner;
  habitable: boolean;
  /** Days left until an active atmosphere processor finishes. 0 = none active. */
  terraformDaysLeft: number;
  /** Who deployed the active atmosphere processor. */
  terraformingBy: Owner | null;
  /** Population in thousands of citizens. */
  population: number;
  /** 0–100. Low morale slows growth and tax income. */
  morale: number;
  /** Tax rate in percent, 0–100. */
  taxRate: number;
  /** Garrisoned soldiers. */
  troops: number;
  mines: number;
  farms: number;
  solarSats: number;
  /** Orbital laser batteries. */
  defense: number;
  mineralRichness: number;
  fertility: number;
  solarFlux: number;
  isHome: boolean;
}

export interface Faction {
  credits: number;
  food: number;
  energy: number;
  minerals: number;
  fuel: number;
  battleCruisers: number;
  /** Atmosphere processors in stock, ready to deploy. */
  atmosphereProcessors: number;
}

export interface LogEntry {
  day: number;
  text: string;
  kind: 'info' | 'good' | 'bad';
}

export interface GameState {
  day: number;
  difficulty: Difficulty;
  status: 'playing' | 'won' | 'lost';
  planets: Planet[];
  player: Faction;
  enemy: Faction;
  log: LogEntry[];
  /** RNG state (mulberry32), mutated on every draw. */
  seed: number;
}

export interface BattleReport {
  attackerWins: boolean;
  attackersSent: number;
  attackersLost: number;
  defendersLost: number;
  lasersDestroyed: number;
}
