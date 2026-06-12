export type Owner = 'player' | 'enemy' | 'neutral';

export type Resource = 'food' | 'energy' | 'minerals' | 'fuel';

/** Resurser som lagras lokalt på planeter (bränsle och krediter är globala). */
export type LocalResource = 'food' | 'energy' | 'minerals';

export type Building = 'mine' | 'farm' | 'solarSat' | 'defense';

export type Difficulty = 0 | 1 | 2 | 3;

export type AiPersonality = 'aggressor' | 'economist' | 'expander';

export type MissionType =
  | 'move' // trupper till egen planet (blir invasion om planeten hunnit falla)
  | 'invade'
  | 'cargo'
  | 'processor'
  | 'outpost'
  | 'probe'
  | 'bombard';

export interface Mission {
  id: number;
  owner: Owner;
  type: MissionType;
  fromId: number;
  toId: number;
  daysLeft: number;
  troops: number;
  /** Stridskryssare bundna till uppdraget; frigörs när det avgörs. */
  battleCruisers: number;
  /** Kargolastare bundna till uppdraget. */
  cargoCruisers: number;
  cargo: { food: number; energy: number; minerals: number };
}

export interface Planet {
  id: number;
  name: string;
  owner: Owner;
  habitable: boolean;
  /** Gruvutpost på karg planet — produktion men ingen befolkning. */
  outpost: boolean;
  /** Dagar kvar tills en aktiv atmosfärprocessor är klar. 0 = ingen aktiv. */
  terraformDaysLeft: number;
  terraformingBy: Owner | null;
  /** Befolkning i tusental medborgare. */
  population: number;
  /** 0–100. Låg moral bromsar tillväxt och skatteintäkter. */
  morale: number;
  /** Skattesats i procent, 0–100. */
  taxRate: number;
  troops: number;
  mines: number;
  farms: number;
  solarSats: number;
  /** Orbitala laserbatterier. */
  defense: number;
  mineralRichness: number;
  fertility: number;
  solarFlux: number;
  isHome: boolean;
  /** Lokala lager (används av spelarens planeter; AI:n spelar med samlad pott). */
  food: number;
  energy: number;
  minerals: number;
  /** Spelarens spaningsdata om fiendeplaneten gäller t.o.m. denna dag. */
  scoutedUntil: number;
}

export interface Faction {
  credits: number;
  fuel: number;
  /** Tillgängliga skepp (de som är på uppdrag räknas inte). */
  battleCruisers: number;
  cargoCruisers: number;
  /** Samlade lager — används bara av AI:n, spelarens resurser ligger på planeterna. */
  pooledFood: number;
  pooledEnergy: number;
  pooledMinerals: number;
}

export interface LogEntry {
  day: number;
  /** i18n-nyckel; texten översätts vid rendering. */
  key: string;
  params?: Record<string, string | number>;
  kind: 'info' | 'good' | 'bad';
}

export interface MarketSwing {
  factor: number;
  daysLeft: number;
}

export interface HistoryPoint {
  day: number;
  playerCredits: number;
  enemyCredits: number;
  playerTroops: number;
  enemyTroops: number;
  playerPlanets: number;
  enemyPlanets: number;
}

export interface GameState {
  version: number;
  day: number;
  difficulty: Difficulty;
  personality: AiPersonality;
  status: 'playing' | 'won' | 'lost';
  planets: Planet[];
  player: Faction;
  enemy: Faction;
  missions: Mission[];
  nextMissionId: number;
  /** Tillfälliga prisfaktorer per resurs (marknadshändelser). */
  marketSwings: Partial<Record<Resource, MarketSwing>>;
  history: HistoryPoint[];
  log: LogEntry[];
  /** RNG-tillstånd (mulberry32), muteras vid varje dragning. */
  seed: number;
}

export interface BattleReport {
  attackerWins: boolean;
  attackersSent: number;
  attackersLost: number;
  defendersLost: number;
  lasersDestroyed: number;
}
