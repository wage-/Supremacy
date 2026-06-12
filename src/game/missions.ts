import { cruiserLosses, resolveBombardment, resolveInvasion } from './combat';
import { PROBE_INTEL_DAYS, TERRAFORM_DAYS, travelDays } from './data';
import { factionOf, log } from './state';
import type { GameState, Mission, MissionType, Owner } from './types';

export interface LaunchSpec {
  owner: Owner;
  type: MissionType;
  fromId: number;
  toId: number;
  troops?: number;
  battleCruisers?: number;
  cargoCruisers?: number;
  cargo?: { food: number; energy: number; minerals: number };
}

/** Skapa ett uppdrag. Anroparen har redan validerat och dragit kostnader. */
export function launch(state: GameState, spec: LaunchSpec): Mission {
  const mission: Mission = {
    id: state.nextMissionId++,
    owner: spec.owner,
    type: spec.type,
    fromId: spec.fromId,
    toId: spec.toId,
    daysLeft: travelDays(spec.fromId, spec.toId),
    troops: spec.troops ?? 0,
    battleCruisers: spec.battleCruisers ?? 0,
    cargoCruisers: spec.cargoCruisers ?? 0,
    cargo: spec.cargo ?? { food: 0, energy: 0, minerals: 0 },
  };
  state.missions.push(mission);

  // Spelarens sensorer ser fiendens flottor närma sig — som i originalet.
  if (spec.owner === 'enemy') {
    const target = state.planets[spec.toId];
    if (target.owner === 'player') {
      log(state, 'log.enemyFleetSpotted', { planet: target.name, days: mission.daysLeft }, 'bad');
    }
  }
  return mission;
}

/** Återlämna uppdragets skepp till ägarens flotta. */
function releaseShips(state: GameState, m: Mission, battleCruisers = m.battleCruisers): void {
  const f = factionOf(state, m.owner);
  f.battleCruisers += battleCruisers;
  f.cargoCruisers += m.cargoCruisers;
}

function resolveArrival(state: GameState, m: Mission): void {
  const target = state.planets[m.toId];
  const friendly = target.owner === m.owner;

  switch (m.type) {
    case 'move':
    case 'invade': {
      if (friendly) {
        // Förstärkning — även en invasionsflotta vars mål redan fallit.
        target.troops += m.troops;
        releaseShips(state, m);
        if (m.owner === 'player') {
          log(state, 'log.troopsArrived', { count: m.troops, planet: target.name }, 'good');
        }
      } else if (target.owner === 'neutral') {
        // Trupper kan inte ockupera obebodda världar — de vänder hem.
        const origin = state.planets[m.fromId];
        if (origin.owner === m.owner) origin.troops += m.troops;
        releaseShips(state, m);
      } else {
        const report = resolveInvasion(state, target, m.owner, m.troops);
        releaseShips(state, m, Math.max(0, m.battleCruisers - cruiserLosses(report)));
      }
      break;
    }
    case 'cargo': {
      if (friendly && m.owner === 'player') {
        target.food += m.cargo.food;
        target.energy += m.cargo.energy;
        target.minerals += m.cargo.minerals;
        log(state, 'log.cargoArrived', { planet: target.name }, 'good');
      } else if (m.owner === 'player') {
        log(state, 'log.cargoLost', { planet: target.name }, 'bad');
      }
      releaseShips(state, m);
      break;
    }
    case 'processor': {
      if (target.owner === 'neutral' && !target.terraformingBy) {
        target.terraformingBy = m.owner;
        target.terraformDaysLeft = TERRAFORM_DAYS;
      }
      // Annars är processorn bortkastad — någon hann före.
      break;
    }
    case 'outpost': {
      if (target.owner === 'neutral' && !target.terraformingBy) {
        target.owner = m.owner;
        target.outpost = true;
        target.troops += m.troops;
        log(
          state,
          m.owner === 'player' ? 'log.outpostEstablished' : 'log.outpostEstablishedEnemy',
          { planet: target.name },
          m.owner === 'player' ? 'good' : 'bad',
        );
      }
      break;
    }
    case 'probe': {
      if (m.owner === 'player' && target.owner === 'enemy') {
        target.scoutedUntil = state.day + PROBE_INTEL_DAYS;
        log(
          state,
          'log.probeReport',
          { planet: target.name, troops: target.troops, defense: target.defense },
          'good',
        );
      }
      break;
    }
    case 'bombard': {
      if (!friendly && target.owner !== 'neutral') {
        resolveBombardment(state, target, m.owner, m.battleCruisers);
      } else {
        releaseShips(state, m);
      }
      break;
    }
  }
}

/** Flytta alla flottor en dag; avgör de som anländer. */
export function runMissions(state: GameState): void {
  const arrived: Mission[] = [];
  for (const m of state.missions) {
    m.daysLeft--;
    if (m.daysLeft <= 0) arrived.push(m);
  }
  state.missions = state.missions.filter((m) => m.daysLeft > 0);
  for (const m of arrived) resolveArrival(state, m);
}
