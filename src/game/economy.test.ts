import { describe, expect, it } from 'vitest';
import { runEconomy, runTerraforming } from './economy';
import { newGame, homeOf } from './state';
import { TERRAFORM_DAYS } from './data';

describe('runEconomy', () => {
  it('producerar resurser lokalt och tar ut skatt globalt', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    const minerals = home.minerals;
    const credits = s.player.credits;
    runEconomy(s, 'player');
    expect(home.minerals).toBeGreaterThan(minerals);
    expect(s.player.credits).toBeGreaterThan(credits);
  });

  it('AI:ns produktion hamnar i den samlade potten', () => {
    const s = newGame(0, 42);
    const pooled = s.enemy.pooledMinerals;
    runEconomy(s, 'enemy');
    expect(s.enemy.pooledMinerals).toBeGreaterThan(pooled);
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
    home.food = 0;
    home.farms = 0;
    const pop = home.population;
    const morale = home.morale;
    runEconomy(s, 'player');
    expect(home.population).toBeLessThan(pop);
    expect(home.morale).toBeLessThan(morale);
  });

  it('trupper utan mat deserterar', () => {
    const s = newGame(0, 42);
    const home = homeOf(s, 'player')!;
    home.food = 0;
    home.farms = 0;
    home.troops = 1000;
    runEconomy(s, 'player');
    expect(home.troops).toBeLessThan(1000);
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
