import { describe, expect, it } from 'vitest';
import { resolveBombardment, resolveInvasion } from './combat';
import { newGame, homeOf } from './state';

describe('resolveInvasion', () => {
  it('en överlägsen styrka erövrar planeten', () => {
    const s = newGame(0, 42);
    const target = homeOf(s, 'enemy')!;
    target.troops = 100;
    target.defense = 0;
    const report = resolveInvasion(s, target, 'player', 5000);
    expect(report.attackerWins).toBe(true);
    expect(target.owner).toBe('player');
    expect(target.troops).toBeGreaterThan(0);
    expect(target.troops).toBeLessThanOrEqual(5000);
  });

  it('en liten styrka slås tillbaka', () => {
    const s = newGame(0, 42);
    const target = homeOf(s, 'enemy')!;
    target.troops = 2000;
    const report = resolveInvasion(s, target, 'player', 50);
    expect(report.attackerWins).toBe(false);
    expect(target.owner).toBe('enemy');
    expect(report.attackersLost).toBe(50);
  });

  it('orbitalförsvar skjuter ner anfallare före landning', () => {
    const s = newGame(0, 42);
    const target = homeOf(s, 'enemy')!;
    target.defense = 5;
    target.troops = 0;
    const report = resolveInvasion(s, target, 'player', 1000);
    expect(report.lasersDestroyed).toBeGreaterThan(0);
  });
});

describe('resolveBombardment', () => {
  it('slår ut trupper och kan slå ut försvar', () => {
    const s = newGame(0, 42);
    const target = homeOf(s, 'enemy')!;
    target.troops = 2000;
    target.defense = 3;
    const before = { troops: target.troops, defense: target.defense };
    const result = resolveBombardment(s, target, 'player', 10);
    expect(result.troopsKilled).toBeGreaterThan(0);
    expect(target.troops).toBe(before.troops - result.troopsKilled);
    expect(target.defense).toBe(before.defense - result.defenseDestroyed);
    expect(target.owner).toBe('enemy'); // bombardemang erövrar inte
  });

  it('överlevande kryssare återvänder till flottan', () => {
    const s = newGame(0, 42);
    const target = homeOf(s, 'enemy')!;
    target.defense = 0;
    const fleet = s.player.battleCruisers;
    resolveBombardment(s, target, 'player', 4);
    expect(s.player.battleCruisers).toBe(fleet + 4); // inga förluster utan försvar
  });
});
