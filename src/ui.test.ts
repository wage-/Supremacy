// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLang } from './i18n';
import { init } from './ui';

function click(selector: string): void {
  const el = document.querySelector<HTMLElement>(selector);
  expect(el, `hittar inte ${selector}`).toBeTruthy();
  el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('ui', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    setLang('sv');
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    document.body.innerHTML = '<div id="app"></div><div id="toast" hidden></div>';
    init();
    // Modulen behåller speltillståndet mellan testerna — gå tillbaka till menyn.
    const quit = document.querySelector<HTMLElement>('[data-action="quit"]');
    if (quit) quit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    confirmSpy.mockClear();
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('visar startskärmen med fyra system', () => {
    expect(document.body.textContent).toContain('SUPREMACY');
    expect(document.querySelectorAll('[data-action="start"]')).toHaveLength(4);
  });

  it('startar ett spel, visar kartan och växlar dag', () => {
    click('[data-action="start"][data-difficulty="0"]');
    expect(document.body.textContent).toContain('Dag 1');
    expect(document.querySelector('.system-map')).toBeTruthy();
    click('[data-action="end-day"]');
    expect(document.body.textContent).toContain('Dag 2');
  });

  it('kan byta språk till engelska', () => {
    expect(document.body.textContent).toContain('Välj stjärnsystem');
    click('[data-action="lang"][data-lang="en"]');
    expect(document.body.textContent).toContain('Choose a star system');
    click('[data-action="start"][data-difficulty="0"]');
    expect(document.body.textContent).toContain('Day 1');
  });

  it('visar fel när en handling misslyckas', () => {
    click('[data-action="start"][data-difficulty="0"]');
    (document.getElementById('qty-food') as HTMLInputElement).value = '999999';
    click('[data-action="sell-res"][data-res="food"]');
    const toast = document.getElementById('toast')!;
    expect(toast.hidden).toBe(false);
    expect(toast.textContent).toContain('lager');
  });

  it('döljer konvojknappar när en konvoj redan är på väg', () => {
    click('[data-action="start"][data-difficulty="0"]');
    click('[data-action="select"][data-id="1"]');
    click('[data-action="send-processor"]');
    expect(document.getElementById('toast')!.hidden).toBe(true); // lyckades
    expect(document.querySelector('[data-action="send-processor"]')).toBeNull();
  });

  it('kan bygga på hemplaneten och se flottrörelser', () => {
    click('[data-action="start"][data-difficulty="0"]');
    click('[data-action="select"][data-id="0"]');
    click('[data-action="build"][data-building="farm"]');
    expect(document.getElementById('toast')!.hidden).toBe(true);
    click('[data-action="select"][data-id="1"]');
    click('[data-action="send-processor"]');
    expect(document.body.textContent).toContain('Atmosfärprocessor till');
  });

  it('visar statistiköverlägget', () => {
    click('[data-action="start"][data-difficulty="0"]');
    click('[data-action="end-day"]');
    click('[data-action="stats"]');
    expect(document.body.textContent).toContain('Statistik — dag');
    expect(document.querySelectorAll('.chart').length).toBe(3);
  });

  it('varnar innan man lämnar ett osparat spel', () => {
    click('[data-action="start"][data-difficulty="0"]');
    click('[data-action="end-day"]');

    confirmSpy.mockReturnValue(false);
    click('[data-action="quit"]');
    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(document.body.textContent).toContain('Dag 2'); // spelet kvar

    confirmSpy.mockReturnValue(true);
    click('[data-action="quit"]');
    expect(document.body.textContent).toContain('Välj stjärnsystem');
  });

  it('varnar inte när spelet är sparat', () => {
    click('[data-action="start"][data-difficulty="0"]');
    click('[data-action="end-day"]');
    click('[data-action="save"]');

    confirmSpy.mockReturnValue(false);
    click('[data-action="quit"]');
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Välj stjärnsystem');
  });

  it('autosparar varje dag och kan återupptas från menyn', () => {
    click('[data-action="start"][data-difficulty="0"]');
    click('[data-action="end-day"]');
    click('[data-action="quit"]'); // confirm är mockad till true
    expect(document.body.textContent).toContain('Fortsätt autospar (dag 2)');
    click('[data-action="load"][data-slot="auto"]');
    expect(document.body.textContent).toContain('Dag 2');
  });

  it('sparar och laddar via localStorage', () => {
    click('[data-action="start"][data-difficulty="1"]');
    click('[data-action="end-day"]');
    click('[data-action="save"]');
    click('[data-action="quit"]');
    expect(document.body.textContent).toContain('Fortsätt sparat spel');
    click('[data-action="load"][data-slot="manual"]');
    expect(document.body.textContent).toContain('Dag 2');
  });
});
