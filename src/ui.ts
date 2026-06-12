import { MARKET, SHIP_COSTS, BUILDING_COSTS, SYSTEMS, TROOPS_PER_CRUISER, FUEL_PER_CRUISER_MISSION, TROOP_COST } from './game/data';
import * as game from './game/game';
import { newGame } from './game/state';
import type { Building, Difficulty, GameState, Planet, Resource } from './game/types';

const SAVE_KEY = 'supremacy-save';

interface UiState {
  state: GameState | null;
  selectedPlanet: number;
  /** Finns det framsteg som inte sparats sedan senaste Spara/Ladda? */
  dirty: boolean;
}

const ui: UiState = { state: null, selectedPlanet: 0, dirty: false };

const RESOURCE_LABELS: Record<Resource, string> = {
  food: 'Mat',
  energy: 'Energi',
  minerals: 'Mineraler',
  fuel: 'Bränsle',
};

const BUILDING_LABELS: Record<Building, string> = {
  mine: 'Gruvstation',
  farm: 'Odlingsstation',
  solarSat: 'Solsatellit',
  defense: 'Orbitalförsvar',
};

function fmt(n: number): string {
  return Math.round(n).toLocaleString('sv-SE');
}

function fmtPop(thousands: number): string {
  return thousands >= 1000 ? `${(thousands / 1000).toFixed(1)} milj` : `${fmt(thousands)} tusen`;
}

function ownerLabel(p: Planet): string {
  if (p.owner === 'player') return 'Din';
  if (p.owner === 'enemy') return 'Fiende';
  return 'Neutral';
}

function costText(c: { credits: number; minerals: number; energy: number }): string {
  const parts = [`${fmt(c.credits)} kr`];
  if (c.minerals) parts.push(`${c.minerals} min`);
  if (c.energy) parts.push(`${c.energy} en`);
  return parts.join(', ');
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showError(msg: string): void {
  const el = document.getElementById('toast')!;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
}

function startScreen(): string {
  const systems = ([0, 1, 2, 3] as Difficulty[])
    .map((d) => {
      const s = SYSTEMS[d];
      return `<button data-action="start" data-difficulty="${d}">
        <span class="sys-label">${s.label}</span>
        <span>${s.name}</span>
        <span class="sys-detail">${s.planetCount} planeter · mot ${s.opponent}</span>
      </button>`;
    })
    .join('');
  const hasSave = localStorage.getItem(SAVE_KEY) !== null;
  return `<div class="screen-start">
    <div>
      <h1 class="title">SUPREMACY</h1>
      <div class="subtitle">DIN VILJA SKE</div>
    </div>
    <div>Välj stjärnsystem:</div>
    <div class="system-buttons">${systems}</div>
    ${hasSave ? '<button data-action="load">Fortsätt sparat spel</button>' : ''}
  </div>`;
}

function topbar(s: GameState): string {
  const f = s.player;
  return `<div class="topbar">
    <span class="stat">Dag <b>${s.day}</b></span>
    <span class="stat">Krediter <b>${fmt(f.credits)}</b></span>
    <span class="stat">Mat <b>${fmt(f.food)}</b></span>
    <span class="stat">Energi <b>${fmt(f.energy)}</b></span>
    <span class="stat">Mineraler <b>${fmt(f.minerals)}</b></span>
    <span class="stat">Bränsle <b>${fmt(f.fuel)}</b></span>
    <span class="stat">Kryssare <b>${f.battleCruisers}</b></span>
    <span class="stat">Atm.proc. <b>${f.atmosphereProcessors}</b></span>
    <span class="spacer"></span>
    <button data-action="end-day">Nästa dag ▸</button>
    <button data-action="end-week">+5 dagar ▸▸</button>
    <button data-action="save">Spara</button>
    <button data-action="quit">Huvudmeny</button>
  </div>`;
}

function planetList(s: GameState): string {
  const rows = s.planets
    .map((p) => {
      let meta = '';
      if (p.terraformDaysLeft > 0) meta = `terraformas ${p.terraformDaysLeft} d`;
      else if (p.habitable) meta = fmtPop(p.population);
      else meta = 'karg';
      return `<button class="planet-row ${p.id === ui.selectedPlanet ? 'selected' : ''}" data-action="select" data-id="${p.id}">
        <span class="dot ${p.owner}"></span>
        <span>${p.name}${p.isHome ? ' ✦' : ''}</span>
        <span class="meta">${meta}</span>
      </button>`;
    })
    .join('');
  return `<div class="panel"><h2>${SYSTEMS[s.difficulty].name}</h2>${rows}</div>`;
}

function buildButtons(): string {
  return (Object.keys(BUILDING_LABELS) as Building[])
    .map(
      (b) => `<div class="row">
        <button data-action="build" data-building="${b}">Bygg ${BUILDING_LABELS[b]}</button>
        <span class="cost">${costText(BUILDING_COSTS[b])}</span>
      </div>`,
    )
    .join('');
}

function playerPlanetActions(s: GameState, p: Planet): string {
  const others = s.planets.filter((x) => x.owner === 'player' && x.id !== p.id);
  const enemies = s.planets.filter((x) => x.owner === 'enemy');
  const moveUi =
    others.length > 0
      ? `<div class="row">
          <button data-action="move">Flytta trupper</button>
          <input id="move-count" type="number" value="100" min="1" />
          <span>till</span>
          <select id="move-target">${others.map((x) => `<option value="${x.id}">${x.name}</option>`).join('')}</select>
        </div>`
      : '';
  const invadeUi =
    enemies.length > 0
      ? `<div class="row">
          <button data-action="invade">Invadera</button>
          <input id="invade-count" type="number" value="500" min="1" />
          <span>mot</span>
          <select id="invade-target">${enemies.map((x) => `<option value="${x.id}">${x.name}</option>`).join('')}</select>
        </div>
        <div class="cost">1 kryssare per ${TROOPS_PER_CRUISER} man, ${FUEL_PER_CRUISER_MISSION} bränsle per kryssare.</div>`
      : '';
  return `<div class="actions">
    ${buildButtons()}
    <div class="row">
      <button data-action="train">Värva trupper</button>
      <input id="train-count" type="number" value="200" min="1" />
      <span class="cost">${TROOP_COST.credits} kr + ${TROOP_COST.energy} en per man (tas ur befolkningen)</span>
    </div>
    <div class="row">
      <span>Skatt: <b id="tax-label">${p.taxRate}%</b></span>
      <input data-action="tax" id="tax-slider" type="range" min="0" max="100" step="5" value="${p.taxRate}" />
    </div>
    ${moveUi}
    ${invadeUi}
  </div>`;
}

function planetDetail(s: GameState): string {
  const p = s.planets.find((x) => x.id === ui.selectedPlanet) ?? s.planets[0];
  ui.selectedPlanet = p.id;

  const rows: Array<[string, string]> = [
    ['Ägare', ownerLabel(p)],
    ['Status', p.terraformDaysLeft > 0 ? `Terraformas (${p.terraformDaysLeft} dagar kvar)` : p.habitable ? 'Beboelig' : 'Karg'],
    ['Befolkning', p.habitable ? fmtPop(p.population) : '–'],
    ['Moral', p.habitable ? `${Math.round(p.morale)} %` : '–'],
    ['Trupper', p.owner === 'player' ? fmt(p.troops) : p.owner === 'enemy' ? 'okänt' : '–'],
    ['Gruvor', p.owner === 'player' ? String(p.mines) : '?'],
    ['Odlingar', p.owner === 'player' ? String(p.farms) : '?'],
    ['Solsatelliter', p.owner === 'player' ? String(p.solarSats) : '?'],
    ['Orbitalförsvar', p.owner === 'player' ? String(p.defense) : '?'],
    ['Mineralrikedom', `${Math.round(p.mineralRichness * 100)} %`],
    ['Bördighet', `${Math.round(p.fertility * 100)} %`],
    ['Solinstrålning', `${Math.round(p.solarFlux * 100)} %`],
  ];
  const grid = rows.map(([k, v]) => `<span class="k">${k}</span><span>${v}</span>`).join('');

  let actions = '';
  if (p.owner === 'player') {
    actions = playerPlanetActions(s, p);
  } else if (p.owner === 'neutral' && p.terraformingBy === null) {
    actions = `<div class="actions"><div class="row">
      <button data-action="deploy">Placera atmosfärprocessor</button>
      <span class="cost">kräver 1 i lager · i lager: ${s.player.atmosphereProcessors}</span>
    </div></div>`;
  } else if (p.owner === 'enemy') {
    actions = `<div class="cost">Fientlig planet – välj en av dina planeter för att skicka en invasionsstyrka härifrån.</div>`;
  }

  return `<div class="panel">
    <h2>${p.name}${p.isHome ? ' ✦' : ''} <span class="owner-${p.owner}">[${ownerLabel(p)}]</span></h2>
    <div class="detail-grid">${grid}</div>
    ${actions}
  </div>`;
}

function sidebar(s: GameState): string {
  const market = (Object.keys(MARKET) as Resource[])
    .map(
      (r) => `<tr>
        <td>${RESOURCE_LABELS[r]}</td>
        <td><input id="qty-${r}" type="number" value="100" min="1" /></td>
        <td><button data-action="buy-res" data-res="${r}">Köp</button></td>
        <td><button data-action="sell-res" data-res="${r}">Sälj</button></td>
        <td class="price">${MARKET[r].buy}/${MARKET[r].sell} kr</td>
      </tr>`,
    )
    .join('');

  const logHtml = s.log
    .slice(-60)
    .map((e) => `<div class="entry ${e.kind}"><span class="d">[${e.day}]</span> ${e.text}</div>`)
    .reverse()
    .join('');

  return `<div>
    <div class="panel">
      <h2>Skeppsvarv</h2>
      <div class="actions">
        <div class="row"><button data-action="buy-cruiser">Köp stridskryssare</button>
          <span class="cost">${costText(SHIP_COSTS.battleCruiser)}</span></div>
        <div class="row"><button data-action="buy-processor">Köp atmosfärprocessor</button>
          <span class="cost">${costText(SHIP_COSTS.atmosphereProcessor)}</span></div>
      </div>
    </div>
    <div class="panel" style="margin-top:10px">
      <h2>Galaktisk marknad (köp/sälj)</h2>
      <table class="market-table">${market}</table>
    </div>
    <div class="panel" style="margin-top:10px">
      <h2>Logg</h2>
      <div class="log">${logHtml}</div>
    </div>
  </div>`;
}

function endOverlay(s: GameState): string {
  if (s.status === 'playing') return '';
  const won = s.status === 'won';
  return `<div class="overlay">
    <div class="big ${s.status}">${won ? 'SUPREMACY!' : 'NEDERLAG'}</div>
    <div>${won ? `Du krossade ${SYSTEMS[s.difficulty].opponent} på dag ${s.day}.` : `${SYSTEMS[s.difficulty].opponent} intog Starbas på dag ${s.day}.`}</div>
    <button data-action="quit">Tillbaka till huvudmenyn</button>
  </div>`;
}

export function render(): void {
  const app = document.getElementById('app')!;
  const s = ui.state;
  if (!s) {
    app.innerHTML = startScreen();
    return;
  }
  app.innerHTML = `
    ${topbar(s)}
    <div class="layout">
      ${planetList(s)}
      ${planetDetail(s)}
      ${sidebar(s)}
    </div>
    ${endOverlay(s)}
  `;
}

function num(id: string): number {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el ? Math.floor(Number(el.value)) : 0;
}

function sel(id: string): number {
  const el = document.getElementById(id) as HTMLSelectElement | null;
  return el ? Number(el.value) : -1;
}

function act(result: game.ActionResult): void {
  if (result) showError(result);
  else ui.dirty = true;
  render();
}

function handleAction(el: HTMLElement): void {
  const action = el.dataset.action!;

  if (action === 'start') {
    ui.state = newGame(Number(el.dataset.difficulty) as Difficulty);
    ui.selectedPlanet = 0;
    ui.dirty = true;
    render();
    return;
  }
  if (action === 'load') {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      ui.state = JSON.parse(raw) as GameState;
      ui.selectedPlanet = 0;
      ui.dirty = false;
    }
    render();
    return;
  }
  if (action === 'quit') {
    if (
      ui.state &&
      ui.state.status === 'playing' &&
      ui.dirty &&
      !window.confirm('Avsluta utan att spara? Osparade framsteg går förlorade.')
    ) {
      return;
    }
    ui.state = null;
    render();
    return;
  }

  const s = ui.state;
  if (!s) return;

  switch (action) {
    case 'save':
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      ui.dirty = false;
      showError('Spelet sparat.');
      break;
    case 'end-day':
      game.endDay(s);
      ui.dirty = true;
      render();
      break;
    case 'end-week':
      for (let i = 0; i < 5 && s.status === 'playing'; i++) game.endDay(s);
      ui.dirty = true;
      render();
      break;
    case 'select':
      ui.selectedPlanet = Number(el.dataset.id);
      render();
      break;
    case 'build':
      act(game.build(s, ui.selectedPlanet, el.dataset.building as Building));
      break;
    case 'buy-cruiser':
      act(game.buyShip(s, 'battleCruiser'));
      break;
    case 'buy-processor':
      act(game.buyShip(s, 'atmosphereProcessor'));
      break;
    case 'deploy':
      act(game.deployProcessor(s, ui.selectedPlanet));
      break;
    case 'train':
      act(game.trainTroops(s, ui.selectedPlanet, num('train-count')));
      break;
    case 'move':
      act(game.moveTroops(s, ui.selectedPlanet, sel('move-target'), num('move-count')));
      break;
    case 'invade':
      act(game.invade(s, ui.selectedPlanet, sel('invade-target'), num('invade-count')));
      break;
    case 'buy-res':
      act(game.buyResource(s, el.dataset.res as Resource, num(`qty-${el.dataset.res}`)));
      break;
    case 'sell-res':
      act(game.sellResource(s, el.dataset.res as Resource, num(`qty-${el.dataset.res}`)));
      break;
  }
}

export function init(): void {
  const app = document.getElementById('app')!;
  window.addEventListener('beforeunload', (e) => {
    if (ui.state && ui.state.status === 'playing' && ui.dirty) e.preventDefault();
  });
  app.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (el && el.dataset.action !== 'tax') handleAction(el);
  });
  app.addEventListener('change', (e) => {
    const el = e.target as HTMLElement;
    if (el.dataset.action === 'tax' && ui.state) {
      act(game.setTax(ui.state, ui.selectedPlanet, Number((el as HTMLInputElement).value)));
    }
  });
  app.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.action === 'tax') {
      const label = document.getElementById('tax-label');
      if (label) label.textContent = `${el.value}%`;
    }
  });
  render();
}
