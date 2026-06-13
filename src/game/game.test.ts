import { describe, expect, it } from 'vitest';
import * as game from './game';
import { newGame, homeOf, planetsOf } from './state';
import { SYSTEMS } from './data';

describe('newGame', () => {
  it('skapar rätt antal planeter med hem i varsin ände', () => {
    const s = newGame(1, 42);
    expect(s.planets).toHaveLength(SYSTEMS[1].planetCount);
    expect(homeOf(s, 'player')!.id).toBe(0);
    expect(homeOf(s, 'enemy')!.id).toBe(SYSTEMS[1].planetCount - 1);
    expect(s.status).toBe('playing');
    expect(['aggressor', 'economist', 'expander']).toContain(s.personality);
  });
});

describe('spelarhandlingar', () => {
  it('build kräver lokala resurser och en egen planet', () => {
    const s = newGame(0, 42);
    expect(game.build(s, 0, 'mine')).toBeNull();
    expect(game.build(s, 1, 'mine')?.key).toBe('err.notYours');
    s.player.credits = 0;
    expect(game.build(s, 0, 'mine')?.key).toBe('err.credits');
  });

  it('marknaden handlar via hemplanetens lager', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    const food = home.food;
    expect(game.buyResource(s, 'food', 100)).toBeNull();
    expect(home.food).toBe(food + 100);
    expect(game.sellResource(s, 'food', 1_000_000)?.key).toBe('err.notEnoughStock');
    // Bränsle är globalt.
    const fuel = s.player.fuel;
    expect(game.buyResource(s, 'fuel', 50)).toBeNull();
    expect(s.player.fuel).toBe(fuel + 50);
  });

  it('trupper värvas ur befolkningen med lokal energi', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    home.energy = 2000;
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
    expect(game.sendTroops(s, 0, enemyHomeId, 1000)?.key).toBe('err.needBattleCruisers');
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
    // En passiv spelare kan förlora på Svår — historiken ska ändå föras.
    expect(s.history.length).toBeGreaterThan(20);
    // AI:n ska ha gjort någonting: byggt, värvat eller expanderat.
    const enemyPlanets = planetsOf(s, 'enemy');
    const activity =
      enemyPlanets.length > 1 ||
      enemyPlanets.some((p) => p.farms + p.mines + p.solarSats > 7 || p.troops > 1000);
    expect(activity).toBe(true);
  });

  it('historiken följer båda fraktionerna', () => {
    const s = newGame(0, 42);
    game.endDay(s);
    const point = s.history.at(-1)!;
    expect(point.playerPlanets).toBe(1);
    expect(point.enemyPlanets).toBeGreaterThanOrEqual(1);
    expect(point.playerTroops).toBeGreaterThan(0);
  });
});
