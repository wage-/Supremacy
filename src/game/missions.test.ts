import { describe, expect, it } from 'vitest';
import { TERRAFORM_DAYS, travelDays } from './data';
import * as game from './game';
import { newGame, homeOf } from './state';

function passDays(s: ReturnType<typeof newGame>, days: number): void {
  for (let i = 0; i < days && s.status === 'playing'; i++) game.endDay(s);
}

describe('flottuppdrag', () => {
  it('trupptransport tar restid och anländer till egen planet', () => {
    const s = newGame(0, 42);
    s.planets[2].owner = 'player';
    s.planets[2].outpost = true;
    s.planets[2].food = 500; // annars deserterar hungriga trupper
    const days = travelDays(0, 2);
    expect(game.sendTroops(s, 0, 2, 300)).toBeNull();
    expect(s.player.battleCruisers).toBe(1); // en kryssare bunden
    expect(s.planets[2].troops).toBe(0);
    passDays(s, days);
    expect(s.planets[2].troops).toBe(300);
    expect(s.player.battleCruisers).toBeGreaterThanOrEqual(2); // återlämnad
  });

  it('invasion avgörs vid ankomst', () => {
    const s = newGame(0, 42);
    const enemyHome = homeOf(s, 'enemy')!;
    const home = homeOf(s, 'player')!;
    home.troops = 60000;
    s.player.battleCruisers = 200;
    s.player.fuel = 100000;
    enemyHome.troops = 100;
    enemyHome.defense = 0;
    expect(game.sendTroops(s, 0, enemyHome.id, 50000)).toBeNull();
    expect(enemyHome.owner).toBe('enemy'); // inte framme än
    passDays(s, travelDays(0, enemyHome.id));
    expect(s.status).toBe('won');
  });

  it('frakt levererar lokala resurser', () => {
    const s = newGame(0, 42);
    s.planets[1].owner = 'player';
    s.planets[1].outpost = true;
    const home = homeOf(s, 'player')!;
    home.food = 500;
    expect(game.sendCargo(s, 0, 1, { food: 200, energy: 0, minerals: 0 })).toBeNull();
    expect(home.food).toBe(300);
    passDays(s, travelDays(0, 1));
    expect(s.planets[1].food).toBeGreaterThanOrEqual(200); // levererat (+ ev. produktion)
  });

  it('atmosfärprocessor reser först, terraformar sedan', () => {
    const s = newGame(0, 42);
    expect(game.sendProcessor(s, 1)).toBeNull();
    expect(game.sendProcessor(s, 1)).not.toBeNull(); // konvoj redan på väg
    passDays(s, travelDays(0, 1));
    expect(s.planets[1].terraformingBy).toBe('player');
    passDays(s, TERRAFORM_DAYS);
    expect(s.planets[1].owner).toBe('player');
    expect(s.planets[1].habitable).toBe(true);
  });

  it('gruvutpost gör en karg planet till din utan befolkning', () => {
    const s = newGame(0, 42);
    expect(game.sendOutpost(s, 2)).toBeNull();
    passDays(s, travelDays(0, 2));
    expect(s.planets[2].owner).toBe('player');
    expect(s.planets[2].outpost).toBe(true);
    expect(s.planets[2].habitable).toBe(false);
    expect(game.build(s, 2, 'mine')).not.toBeNull(); // saknar lokal energi än
    s.planets[2].energy = 100;
    expect(game.build(s, 2, 'mine')).toBeNull();
    expect(game.build(s, 2, 'farm')).not.toBeNull(); // odlingar kräver terraformning
  });

  it('spionsond avslöjar fiendens garnison en tid', () => {
    const s = newGame(0, 42);
    const enemyHome = homeOf(s, 'enemy')!;
    expect(game.sendProbe(s, enemyHome.id)).toBeNull();
    passDays(s, travelDays(0, enemyHome.id));
    expect(enemyHome.scoutedUntil).toBeGreaterThan(s.day);
  });
});
