// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { init } from './ui';

function click(selector: string): void {
  const el = document.querySelector<HTMLElement>(selector);
  expect(el, `hittar inte ${selector}`).toBeTruthy();
  el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('ui', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div><div id="toast" hidden></div>';
    init();
    // Modulen behåller speltillståndet mellan testerna — gå tillbaka till menyn.
    const quit = document.querySelector<HTMLElement>('[data-action="quit"]');
    if (quit) quit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
