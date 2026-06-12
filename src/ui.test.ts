// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('startar ett spel och växlar dag', () => {
    click('[data-action="start"][data-difficulty="0"]');
    expect(document.body.textContent).toContain('Dag 1');
    expect(document.body.textContent).toContain('Starbas');
    click('[data-action="end-day"]');
    expect(document.body.textContent).toContain('Dag 2');
  });

  it('visar fel när en handling misslyckas', () => {
    click('[data-action="start"][data-difficulty="0"]');
    // Välj en neutral planet och försök placera en processor utan att äga någon.
    click('[data-action="select"][data-id="1"]');
    click('[data-action="deploy"]');
    const toast = document.getElementById('toast')!;
    expect(toast.hidden).toBe(false);
    expect(toast.textContent).toContain('atmosfärprocessor');
  });

  it('kan bygga på hemplaneten', () => {
    click('[data-action="start"][data-difficulty="0"]');
    click('[data-action="select"][data-id="0"]');
    click('[data-action="build"][data-building="farm"]');
    expect(document.getElementById('toast')!.hidden).toBe(true);
    expect(document.body.textContent).toContain('Odlingar');
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

  it('sparar och laddar via localStorage', () => {
    click('[data-action="start"][data-difficulty="1"]');
    click('[data-action="end-day"]');
    click('[data-action="save"]');
    click('[data-action="quit"]');
    expect(document.body.textContent).toContain('Fortsätt sparat spel');
    click('[data-action="load"]');
    expect(document.body.textContent).toContain('Dag 2');
  });
});
