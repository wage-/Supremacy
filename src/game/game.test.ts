import { describe, expect, it } from 'vitest';
import * as game from './game';
import { newGame, homeOf, planetsOf } from './state';
import { SYSTEMS, TERRAFORM_DAYS } from './data';

describe('newGame', () => {
  it('skapar rätt antal planeter med hem i varsin ände', () => {
    const s = newGame(1, 42);
    expect(s.planets).toHaveLength(SYSTEMS[1].planetCount);
    expect(homeOf(s, 'player')!.id).toBe(0);
    expect(homeOf(s, 'enemy')!.id).toBe(SYSTEMS[1].planetCount - 1);
    expect(s.status).toBe('playing');
  });
});

describe('spelarhandlingar', () => {
  it('build kräver resurser och en egen planet', () => {
    const s = newGame(0, 42);
    expect(game.build(s, 0, 'mine')).toBeNull();
    expect(game.build(s, 1, 'mine')).toMatch(/tillhör inte/);
    s.player.credits = 0;
    expect(game.build(s, 0, 'mine')).toMatch(/krediter/);
  });

  it('marknaden köper och säljer mot krediter', () => {
    const s = newGame(0, 42);
    const credits = s.player.credits;
    expect(game.buyResource(s, 'food', 100)).toBeNull();
    expect(s.player.credits).toBeLessThan(credits);
    expect(game.sellResource(s, 'food', 1_000_000)).toMatch(/inte så mycket/);
  });

  it('terraformning via processor ger spelaren planeten', () => {
    const s = newGame(0, 42);
    s.player.atmosphereProcessors = 1;
    expect(game.deployProcessor(s, 1)).toBeNull();
    expect(game.deployProcessor(s, 1)).toMatch(/redan|lager/);
    for (let i = 0; i < TERRAFORM_DAYS; i++) game.endDay(s);
    expect(s.planets[1].owner).toBe('player');
  });

  it('trupper värvas ur befolkningen', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    s.player.energy = 2000;
    const pop = home.population;
    const troops = home.troops;
    expect(game.trainTroops(s, 0, 1000)).toBeNull();
    expect(home.troops).toBe(troops + 1000);
    expect(home.population).toBe(pop - 1);
  });

  it('invasion kräver kryssare och bränsle', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    home.troops = 5000;
    s.player.battleCruisers = 0;
    const enemyHomeId = homeOf(s, 'enemy')!.id;
    expect(game.invade(s, 0, enemyHomeId, 1000)).toMatch(/kryssare/i);
  });

  it('spelet vinns när fiendens hemplanet faller', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    home.troops = 50000;
    s.player.battleCruisers = 200;
    s.player.fuel = 100000;
    const enemyHomeId = homeOf(s, 'enemy')!.id;
    expect(game.invade(s, 0, enemyHomeId, 40000)).toBeNull();
    expect(s.status).toBe('won');
  });
});

describe('endDay', () => {
  it('AI:n agerar och spelet förblir konsistent över 60 dagar', () => {
    const s = newGame(2, 7);
    for (let i = 0; i < 60 && s.status === 'playing'; i++) game.endDay(s);
    expect(s.day).toBeGreaterThan(1);
    for (const p of s.planets) {
      expect(p.population).toBeGreaterThanOrEqual(0);
      expect(p.troops).toBeGreaterThanOrEqual(0);
    }
    expect(s.player.credits).toBeGreaterThanOrEqual(0);
    expect(s.enemy.credits).toBeGreaterThanOrEqual(0);
    // AI:n ska ha gjort någonting: byggt, värvat eller expanderat.
    const enemyPlanets = planetsOf(s, 'enemy');
    const activity =
      enemyPlanets.length > 1 ||
      enemyPlanets.some((p) => p.farms + p.mines + p.solarSats > 7 || p.troops > 1000);
    expect(activity).toBe(true);
  });
});
