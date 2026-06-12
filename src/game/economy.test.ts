import { describe, expect, it } from 'vitest';
import { runEconomy, runTerraforming } from './economy';
import { newGame, homeOf } from './state';
import { TERRAFORM_DAYS } from './data';

describe('runEconomy', () => {
  it('producerar resurser och tar ut skatt', () => {
    const s = newGame(0, 42);
    const before = { ...s.player };
    runEconomy(s, 'player');
    expect(s.player.energy).toBeGreaterThan(before.energy - 50);
    expect(s.player.minerals).toBeGreaterThan(before.minerals);
    expect(s.player.credits).toBeGreaterThan(before.credits);
  });

  it('befolkningen växer när det finns mat', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    const pop = home.population;
    runEconomy(s, 'player');
    expect(home.population).toBeGreaterThan(pop);
  });

  it('svält krymper befolkningen och sänker moralen', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    s.player.food = 0;
    home.farms = 0;
    const pop = home.population;
    const morale = home.morale;
    runEconomy(s, 'player');
    expect(home.population).toBeLessThan(pop);
    expect(home.morale).toBeLessThan(morale);
  });
});

describe('runTerraforming', () => {
  it('koloniserar planeten åt rätt ägare när tiden är ute', () => {
    const s = newGame(0, 42);
    const target = s.planets[1];
    target.terraformingBy = 'player';
    target.terraformDaysLeft = TERRAFORM_DAYS;
    for (let i = 0; i < TERRAFORM_DAYS; i++) runTerraforming(s);
    expect(target.owner).toBe('player');
    expect(target.habitable).toBe(true);
    expect(target.population).toBeGreaterThan(0);
    expect(target.terraformingBy).toBeNull();
  });
});
