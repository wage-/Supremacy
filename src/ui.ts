import {
  BUILDING_COSTS,
  CONVOY_COSTS,
  SAVE_VERSION,
  SHIP_COSTS,
  SYSTEMS,
  TROOPS_PER_CRUISER,
  CARGO_PER_CRUISER,
  TROOP_COST,
  travelDays,
  type Cost,
} from './game/data';
import * as game from './game/game';
import { marketPrice } from './game/events';
import { newGame } from './game/state';
import type { Building, Difficulty, GameState, Mission, Planet, Resource } from './game/types';
import { addHighscore, loadHighscores } from './highscore';
import { getLang, setLang, t } from './i18n';
import { isMuted, play, toggleMuted } from './sound';
import { TUTORIAL_COUNT, TUTORIAL_STEPS } from './tutorial';

const SAVE_KEY = 'supremacy-save';
const AUTOSAVE_KEY = 'supremacy-autosave';

interface UiState {
  state: GameState | null;
  selectedPlanet: number;
  showStats: boolean;
  showHelp: boolean;
  /** Aktivt handledningssteg, eller null när handledningen inte körs. */
  tutorial: number | null;
  /** Baslinjevärde för att upptäcka när det aktiva steget är avklarat. */
  tutorialBaseline: number;
  /** Finns det framsteg som inte sparats sedan senaste Spara/Ladda? */
  dirty: boolean;
}

const ui: UiState = {
  state: null,
  selectedPlanet: 0,
  showStats: false,
  showHelp: false,
  tutorial: null,
  tutorialBaseline: 0,
  dirty: false,
};

const RESOURCES: Resource[] = ['food', 'energy', 'minerals', 'fuel'];
const BUILDINGS: Building[] = ['mine', 'farm', 'solarSat', 'defense'];

function fmt(n: number): string {
  return Math.round(n).toLocaleString(getLang() === 'sv' ? 'sv-SE' : 'en-GB');
}

function fmtPop(thousands: number): string {
  return thousands >= 1000
    ? t('ui.millions', { n: (thousands / 1000).toFixed(1) })
    : t('ui.thousands', { n: fmt(thousands) });
}

function costText(c: Cost): string {
  const parts = [`${fmt(c.credits)} cr`];
  if (c.minerals) parts.push(`${c.minerals} min`);
  if (c.energy) parts.push(`${c.energy} en`);
  return parts.join(', ');
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function showToast(msg: string, isError = true): void {
  const el = document.getElementById('toast')!;
  el.textContent = msg;
  el.classList.toggle('ok', !isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 3500);
  if (isError) play('error');
}

// ---------- Sparfiler ----------

function readSave(key: string): GameState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    return parsed.version === SAVE_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function autosave(s: GameState): void {
  if (s.status === 'playing') localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(s));
  else localStorage.removeItem(AUTOSAVE_KEY);
}

// ---------- Startskärm ----------

function langButtons(): string {
  const lang = getLang();
  return `<span class="lang-toggle">
    <button data-action="lang" data-lang="sv" class="${lang === 'sv' ? 'active' : ''}">SV</button>
    <button data-action="lang" data-lang="en" class="${lang === 'en' ? 'active' : ''}">EN</button>
  </span>`;
}

function startScreen(): string {
  const systems = ([0, 1, 2, 3] as Difficulty[])
    .map((d) => {
      const s = SYSTEMS[d];
      return `<button data-action="start" data-difficulty="${d}">
        <span class="sys-label">${t(`diff.${d}`)}</span>
        <span>${t('ui.systemName', { name: s.name })}</span>
        <span class="sys-detail">${s.planetCount} ${t('ui.planets')} · ${t('ui.against')} ${t(`opp.${d}`)}</span>
      </button>`;
    })
    .join('');

  const manual = readSave(SAVE_KEY);
  const auto = readSave(AUTOSAVE_KEY);
  const highscores = loadHighscores()
    .slice(0, 5)
    .map(
      (h) =>
        `<li>${t('ui.hsEntry', {
          system: t('ui.systemName', { name: h.systemName }),
          label: `@diff.${h.difficulty}`,
          days: h.days,
        })}</li>`,
    )
    .join('');

  return `<div class="screen-start">
    <div class="start-corner">${langButtons()}</div>
    <div>
      <h1 class="title">SUPREMACY</h1>
      <div class="subtitle">${t('ui.tagline')}</div>
    </div>
    <div>${t('ui.chooseSystem')}</div>
    <div class="system-buttons">${systems}</div>
    <div class="system-buttons">
      ${manual ? `<button data-action="load" data-slot="manual">${t('ui.continueSave', { day: manual.day })}</button>` : ''}
      ${auto ? `<button data-action="load" data-slot="auto">${t('ui.continueAutosave', { day: auto.day })}</button>` : ''}
    </div>
    <div class="system-buttons">
      <button data-action="tutorial">${t('ui.tutorialBtn')}</button>
      <button data-action="help">${t('ui.instructions')}</button>
    </div>
    <div class="highscores">
      <h3>${t('ui.highscores')}</h3>
      ${highscores ? `<ol>${highscores}</ol>` : `<div class="cost">${t('ui.noHighscores')}</div>`}
    </div>
  </div>`;
}

// ---------- Topprad ----------

function topbar(s: GameState): string {
  const f = s.player;
  return `<div class="topbar">
    <span class="stat">${t('ui.day')} <b>${s.day}</b></span>
    <span class="stat">${t('ui.credits')} <b>${fmt(f.credits)}</b></span>
    <span class="stat">${t('ui.fuel')} <b>${fmt(f.fuel)}</b></span>
    <span class="stat" title="${t('ui.battleCruisers')}">⚔ <b>${f.battleCruisers}</b></span>
    <span class="stat" title="${t('ui.cargoCruisers')}">⛟ <b>${f.cargoCruisers}</b></span>
    <span class="spacer"></span>
    <button data-action="end-day">${t('ui.nextDay')}</button>
    <button data-action="end-week">${t('ui.next5Days')}</button>
    <button data-action="save">${t('ui.save')}</button>
    <button data-action="stats">${t('ui.stats')}</button>
    <button data-action="help" title="${t('ui.instructions')}">?</button>
    <button data-action="sound" title="${t('ui.sound')}">${isMuted() ? '🔇' : '🔊'}</button>
    ${langButtons()}
    <button data-action="quit">${t('ui.menu')}</button>
  </div>`;
}

// ---------- Systemkarta ----------

function planetPos(p: Planet, count: number, size: number): { x: number; y: number; r: number } {
  const c = size / 2;
  const minR = 34;
  const maxR = c - 18;
  const orbit = count > 1 ? minR + (p.id / (count - 1)) * (maxR - minR) : minR;
  const angle = p.id * 2.39996 + 0.7; // gyllene vinkeln sprider planeterna
  return { x: c + orbit * Math.cos(angle), y: c + orbit * Math.sin(angle), r: orbit };
}

function systemMap(s: GameState): string {
  const size = 340;
  const c = size / 2;
  const n = s.planets.length;

  const orbits = s.planets
    .map((p) => `<circle class="orbit" cx="${c}" cy="${c}" r="${planetPos(p, n, size).r.toFixed(1)}"/>`)
    .join('');

  const fleets = s.missions
    .filter((m) => m.owner === 'player' || s.planets[m.toId].owner === 'player')
    .map((m) => {
      const a = planetPos(s.planets[m.fromId], n, size);
      const b = planetPos(s.planets[m.toId], n, size);
      const total = travelDays(m.fromId, m.toId);
      const prog = Math.min(1, Math.max(0, (total - m.daysLeft) / total));
      const x = a.x + (b.x - a.x) * prog;
      const y = a.y + (b.y - a.y) * prog;
      return `<rect class="fleet ${m.owner}" x="${(x - 3).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="6" height="6" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    })
    .join('');

  const planets = s.planets
    .map((p) => {
      const pos = planetPos(p, n, size);
      const selected = p.id === ui.selectedPlanet ? 'selected' : '';
      const radius = p.isHome ? 9 : 6.5;
      return `<g class="map-planet" data-action="select" data-id="${p.id}">
        <circle class="body ${p.owner} ${selected}" cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${radius}"/>
        <text x="${pos.x.toFixed(1)}" y="${(pos.y - radius - 4).toFixed(1)}">${p.name}</text>
      </g>`;
    })
    .join('');

  return `<svg class="system-map" viewBox="0 0 ${size} ${size}" role="img">
    ${orbits}
    <circle class="sun" cx="${c}" cy="${c}" r="11"/>
    ${fleets}
    ${planets}
  </svg>`;
}

function planetList(s: GameState): string {
  const rows = s.planets
    .map((p) => {
      let meta: string;
      if (p.terraformDaysLeft > 0) meta = t('ui.terraformingShort', { days: p.terraformDaysLeft });
      else if (p.habitable) meta = fmtPop(p.population);
      else if (p.outpost) meta = t('ui.outpostShort');
      else meta = t('ui.barren');
      return `<button class="planet-row ${p.id === ui.selectedPlanet ? 'selected' : ''}" data-action="select" data-id="${p.id}">
        <span class="dot ${p.owner}"></span>
        <span>${p.name}${p.isHome ? ' ✦' : ''}</span>
        <span class="meta">${meta}</span>
      </button>`;
    })
    .join('');
  return `<div class="panel">
    <h2>${t('ui.systemName', { name: SYSTEMS[s.difficulty].name })}</h2>
    ${systemMap(s)}
    ${rows}
  </div>`;
}

// ---------- Planetdetaljer ----------

function ownerLabel(p: Planet): string {
  if (p.owner === 'player') return t('ui.ownerYou');
  if (p.owner === 'enemy') return t('ui.ownerEnemy');
  return t('ui.ownerNeutral');
}

function statusLabel(p: Planet): string {
  if (p.terraformDaysLeft > 0) return t('ui.statusTerraforming', { days: p.terraformDaysLeft });
  if (p.habitable) return t('ui.statusHabitable');
  if (p.outpost) return t('ui.statusOutpost');
  return t('ui.statusBarren');
}

function playerPlanetActions(s: GameState, p: Planet): string {
  const buildButtons = BUILDINGS.filter((b) => b !== 'farm' || p.habitable)
    .map(
      (b) => `<div class="row">
        <button data-action="build" data-building="${b}">${t('ui.build', { name: t(`b.${b}`) })}</button>
        <span class="cost">${costText(BUILDING_COSTS[b])}</span>
      </div>`,
    )
    .join('');

  const trainUi = p.habitable
    ? `<div class="row">
        <button data-action="train">${t('ui.train')}</button>
        <input id="train-count" type="number" value="200" min="1" />
        <span class="cost">${t('ui.trainCost', { credits: TROOP_COST.credits, energy: TROOP_COST.energy })}</span>
      </div>
      <div class="row">
        <span>${t('ui.tax')}: <b id="tax-label">${p.taxRate}%</b></span>
        <input data-action="tax" id="tax-slider" type="range" min="0" max="100" step="5" value="${p.taxRate}" />
      </div>`
    : '';

  const troopTargets = s.planets.filter((x) => x.id !== p.id && x.owner !== 'neutral');
  const troopsUi =
    troopTargets.length > 0
      ? `<div class="row">
          <button data-action="send-troops">${t('ui.sendTroops')}</button>
          <input id="troop-count" type="number" value="500" min="1" />
          <span>${t('ui.to')}</span>
          <select id="troop-target">${troopTargets
            .map((x) => `<option value="${x.id}">${x.name}${x.owner === 'enemy' ? ' ⚔' : ''}</option>`)
            .join('')}</select>
        </div>
        <div class="cost">${t('ui.troopHint', { cap: TROOPS_PER_CRUISER })}</div>`
      : '';

  const cargoTargets = s.planets.filter((x) => x.id !== p.id && x.owner === 'player');
  const cargoUi =
    cargoTargets.length > 0
      ? `<div class="row">
          <button data-action="send-cargo">${t('ui.sendCargo')}</button>
          <input id="cargo-food" type="number" value="0" min="0" title="${t('res.food')}" />
          <input id="cargo-energy" type="number" value="0" min="0" title="${t('res.energy')}" />
          <input id="cargo-minerals" type="number" value="0" min="0" title="${t('res.minerals')}" />
          <span>${t('ui.to')}</span>
          <select id="cargo-target">${cargoTargets.map((x) => `<option value="${x.id}">${x.name}</option>`).join('')}</select>
        </div>
        <div class="cost">${t('res.food')} / ${t('res.energy')} / ${t('res.minerals')} — ${t('ui.cargoHint', { cap: CARGO_PER_CRUISER })}</div>`
      : '';

  return `<div class="actions">${buildButtons}${trainUi}${troopsUi}${cargoUi}</div>`;
}

function neutralPlanetActions(s: GameState, p: Planet): string {
  if (p.terraformingBy || s.missions.some((m) => m.toId === p.id && (m.type === 'processor' || m.type === 'outpost'))) {
    return '';
  }
  return `<div class="actions">
    <div class="row">
      <button data-action="send-processor">${t('ui.deployProcessor')}</button>
      <span class="cost">${costText(CONVOY_COSTS.processor)}</span>
    </div>
    <div class="row">
      <button data-action="send-outpost">${t('ui.deployOutpost')}</button>
      <span class="cost">${costText(CONVOY_COSTS.outpost)}</span>
    </div>
  </div>`;
}

function enemyPlanetActions(p: Planet): string {
  return `<div class="actions">
    <div class="cost">${t('ui.enemyPlanetHint')}</div>
    <div class="row">
      <button data-action="send-probe">${t('ui.sendProbe')}</button>
      <span class="cost">${costText(CONVOY_COSTS.probe)}${p.scoutedUntil > 0 ? ` · ${t('ui.scouted', { day: p.scoutedUntil })}` : ''}</span>
    </div>
    <div class="row">
      <button data-action="bombard">${t('ui.bombard')}</button>
      <input id="bombard-count" type="number" value="2" min="1" />
      <span class="cost">${t('ui.bombardHint')}</span>
    </div>
  </div>`;
}

function planetDetail(s: GameState): string {
  const p = s.planets.find((x) => x.id === ui.selectedPlanet) ?? s.planets[0];
  ui.selectedPlanet = p.id;

  const mine = p.owner === 'player';
  const scouted = p.owner === 'enemy' && s.day <= p.scoutedUntil;
  const known = mine || scouted;
  const q = (v: string | number) => (known ? String(v) : '?');

  const rows: Array<[string, string]> = [
    [t('ui.owner'), ownerLabel(p)],
    [t('ui.status'), statusLabel(p)],
    [t('ui.population'), p.habitable ? fmtPop(p.population) : '–'],
    [t('ui.morale'), mine && p.habitable ? `${Math.round(p.morale)} %` : p.habitable ? '?' : '–'],
    [t('ui.troops'), p.owner === 'neutral' ? '–' : q(fmt(p.troops))],
    [t('ui.mines'), p.owner === 'neutral' ? '–' : q(p.mines)],
    [t('ui.farms'), p.owner === 'neutral' ? '–' : q(p.farms)],
    [t('ui.solarSats'), p.owner === 'neutral' ? '–' : q(p.solarSats)],
    [t('ui.defense'), p.owner === 'neutral' ? '–' : q(p.defense)],
    [t('ui.richness'), `${Math.round(p.mineralRichness * 100)} %`],
    [t('ui.fertility'), `${Math.round(p.fertility * 100)} %`],
    [t('ui.solarFlux'), `${Math.round(p.solarFlux * 100)} %`],
  ];
  if (mine) {
    rows.push([
      t('ui.localStocks'),
      `${t('res.food')} ${fmt(p.food)} · ${t('res.energy')} ${fmt(p.energy)} · ${t('res.minerals')} ${fmt(p.minerals)}`,
    ]);
  }
  const grid = rows.map(([k, v]) => `<span class="k">${k}</span><span>${v}</span>`).join('');

  let actions = '';
  if (mine) actions = playerPlanetActions(s, p);
  else if (p.owner === 'neutral') actions = neutralPlanetActions(s, p);
  else actions = enemyPlanetActions(p);

  return `<div class="panel">
    <h2>${p.name}${p.isHome ? ' ✦' : ''} <span class="owner-${p.owner}">[${ownerLabel(p)}]</span></h2>
    <div class="detail-grid">${grid}</div>
    ${actions}
  </div>`;
}

// ---------- Sidopanel ----------

function missionLabel(s: GameState, m: Mission): string {
  const target = s.planets[m.toId].name;
  if (m.owner === 'enemy') return t('ui.unknownFleet', { planet: target });
  return t(`m.${m.type}`, { planet: target });
}

function sidebar(s: GameState): string {
  const market = RESOURCES.map((r) => {
    const price = marketPrice(s, r);
    const swung = s.marketSwings[r] ? ' swung' : '';
    return `<tr>
      <td>${t(`res.${r}`)}</td>
      <td><input id="qty-${r}" type="number" value="100" min="1" /></td>
      <td><button data-action="buy-res" data-res="${r}">${t('ui.buy')}</button></td>
      <td><button data-action="sell-res" data-res="${r}">${t('ui.sell')}</button></td>
      <td class="price${swung}">${price.buy}/${price.sell} cr</td>
    </tr>`;
  }).join('');

  const missions = s.missions
    .filter((m) => m.owner === 'player' || s.planets[m.toId].owner === 'player')
    .map(
      (m) => `<div class="entry ${m.owner === 'enemy' ? 'bad' : ''}">
        ${missionLabel(s, m)} — ${t('ui.missionDays', { days: m.daysLeft })}
      </div>`,
    )
    .join('');

  const logHtml = s.log
    .slice(-60)
    .map((e) => `<div class="entry ${e.kind}"><span class="d">[${e.day}]</span> ${t(e.key, e.params)}</div>`)
    .reverse()
    .join('');

  return `<div>
    <div class="panel">
      <h2>${t('ui.shipyard')}</h2>
      <div class="actions">
        <div class="row"><button data-action="buy-battle">${t('ui.buyBattleCruiser')}</button>
          <span class="cost">${costText(SHIP_COSTS.battleCruiser)}</span></div>
        <div class="row"><button data-action="buy-cargo">${t('ui.buyCargoCruiser')}</button>
          <span class="cost">${costText(SHIP_COSTS.cargoCruiser)}</span></div>
      </div>
    </div>
    <div class="panel">
      <h2>${t('ui.market')}</h2>
      <table class="market-table">${market}</table>
      <div class="cost">${t('ui.marketHint')}</div>
    </div>
    <div class="panel">
      <h2>${t('ui.missions')}</h2>
      <div class="log">${missions || `<div class="entry cost">${t('ui.noMissions')}</div>`}</div>
    </div>
    <div class="panel">
      <h2>${t('ui.log')}</h2>
      <div class="log">${logHtml}</div>
    </div>
  </div>`;
}

// ---------- Statistik ----------

function polyline(values: Array<{ x: number; y: number }>, maxX: number, maxY: number, w: number, h: number): string {
  if (values.length < 2) return '';
  const pts = values
    .map((v) => `${((v.x / maxX) * (w - 10) + 5).toFixed(1)},${(h - 5 - (v.y / maxY) * (h - 15)).toFixed(1)}`)
    .join(' ');
  return pts;
}

function statsOverlay(s: GameState): string {
  if (!ui.showStats) return '';
  const hist = s.history;
  const w = 360;
  const h = 110;

  const charts = (
    [
      ['ui.statsCredits', (p: (typeof hist)[number]) => p.playerCredits, (p: (typeof hist)[number]) => p.enemyCredits],
      ['ui.statsTroops', (p: (typeof hist)[number]) => p.playerTroops, (p: (typeof hist)[number]) => p.enemyTroops],
      ['ui.statsPlanets', (p: (typeof hist)[number]) => p.playerPlanets, (p: (typeof hist)[number]) => p.enemyPlanets],
    ] as const
  )
    .map(([key, mine, theirs]) => {
      const maxX = Math.max(s.day, 2);
      const maxY = Math.max(...hist.map(mine), ...hist.map(theirs), 1);
      const minePts = polyline(hist.map((p) => ({ x: p.day, y: mine(p) })), maxX, maxY, w, h);
      const theirPts = polyline(hist.map((p) => ({ x: p.day, y: theirs(p) })), maxX, maxY, w, h);
      return `<div class="chart">
        <h3>${t(key)}</h3>
        <svg viewBox="0 0 ${w} ${h}">
          <polyline class="line player" points="${minePts}"/>
          <polyline class="line enemy" points="${theirPts}"/>
        </svg>
      </div>`;
    })
    .join('');

  return `<div class="overlay">
    <div class="panel stats-panel">
      <h2>${t('ui.statsTitle', { day: s.day })}</h2>
      <div class="legend">
        <span class="owner-player">■ ${t('ui.you')}</span>
        <span class="owner-enemy">■ ${t('ui.enemy')}</span>
      </div>
      ${charts}
      <button data-action="stats">${t('ui.close')}</button>
    </div>
  </div>`;
}

function endOverlay(s: GameState): string {
  if (s.status === 'playing') return '';
  const won = s.status === 'won';
  const opponent = `@opp.${s.difficulty}`;
  return `<div class="overlay">
    <div class="big ${s.status}">${won ? t('ui.victory') : t('ui.defeat')}</div>
    <div>${won ? t('ui.wonText', { opponent, day: s.day }) : t('ui.lostText', { opponent, day: s.day })}</div>
    <button data-action="quit">${t('ui.backToMenu')}</button>
  </div>`;
}

// ---------- Instruktioner (manual) ----------

function helpOverlay(): string {
  if (!ui.showHelp) return '';
  const sections = Array.from({ length: 9 }, (_, i) => `<h3>${t(`help.${i}.h`)}</h3><p>${t(`help.${i}.b`)}</p>`).join('');
  return `<div class="overlay">
    <div class="panel help-panel">
      <h2>${t('help.title')}</h2>
      ${sections}
      <button data-action="help">${t('ui.close')}</button>
    </div>
  </div>`;
}

// ---------- Handledning ----------

/** Läs in steget: fånga baslinje och markera ev. vägledd planet. */
function enterTutorialStep(s: GameState, i: number): void {
  const step = TUTORIAL_STEPS[i];
  ui.tutorialBaseline = step.capture ? step.capture(s) : 0;
  if (step.select) {
    const id = step.select(s);
    if (id !== null) ui.selectedPlanet = id;
  }
}

function startTutorial(): void {
  ui.state = newGame(0);
  ui.selectedPlanet = 0;
  ui.showStats = false;
  ui.showHelp = false;
  ui.dirty = true;
  ui.tutorial = 0;
  enterTutorialStep(ui.state, 0);
  play('title');
}

function advanceTutorial(s: GameState): void {
  if (ui.tutorial === null) return;
  const next = ui.tutorial + 1;
  if (next >= TUTORIAL_COUNT) ui.tutorial = null;
  else {
    ui.tutorial = next;
    enterTutorialStep(s, next);
  }
}

/** Avancera automatiskt så länge det aktiva stegets villkor är uppfyllt. */
function maybeAdvanceTutorial(s: GameState): void {
  while (ui.tutorial !== null) {
    const step = TUTORIAL_STEPS[ui.tutorial];
    if (step.done && step.done(s, ui.tutorialBaseline)) advanceTutorial(s);
    else break;
  }
}

function tutorialBox(s: GameState): string {
  if (ui.tutorial === null || s.status !== 'playing') return '';
  const i = ui.tutorial;
  const step = TUTORIAL_STEPS[i];
  const hint = step.done ? `<div class="tut-hint">${t('ui.tutDoThis')}</div>` : '';
  return `<div class="tutorial-box">
    <div class="tut-progress">${t('ui.tutorialStep', { n: i + 1, total: TUTORIAL_COUNT })}</div>
    <h3>${t(`tut.${i}.title`)}</h3>
    <p>${t(`tut.${i}.body`)}</p>
    ${hint}
    <div class="tut-controls">
      <button data-action="tut-next">${t('ui.tutNext')}</button>
      <button data-action="tut-skip">${t('ui.tutSkip')}</button>
    </div>
  </div>`;
}

// ---------- Rendering ----------

export function render(): void {
  const app = document.getElementById('app')!;
  const s = ui.state;
  if (!s) {
    app.innerHTML = startScreen() + helpOverlay();
    return;
  }
  maybeAdvanceTutorial(s);
  app.innerHTML = `
    ${topbar(s)}
    <div class="layout">
      ${planetList(s)}
      ${planetDetail(s)}
      ${sidebar(s)}
    </div>
    ${tutorialBox(s)}
    ${statsOverlay(s)}
    ${endOverlay(s)}
    ${helpOverlay()}
  `;
}

// ---------- Händelser ----------

function num(id: string): number {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el ? Math.floor(Number(el.value)) : 0;
}

function sel(id: string): number {
  const el = document.getElementById(id) as HTMLSelectElement | null;
  return el ? Number(el.value) : -1;
}

function act(result: game.ActionResult): void {
  if (result) showToast(t(result.key, result.params));
  else {
    ui.dirty = true;
    play('click');
    if (ui.state) autosave(ui.state);
  }
  render();
}

function afterDays(s: GameState, logLenBefore: number): void {
  ui.dirty = true;
  autosave(s);
  const newEntries = s.log.slice(logLenBefore);
  if (s.status === 'won') {
    addHighscore({
      date: new Date().toISOString().slice(0, 10),
      difficulty: s.difficulty,
      systemName: SYSTEMS[s.difficulty].name,
      days: s.day,
    });
    play('win');
  } else if (s.status === 'lost') {
    play('lose');
  } else if (newEntries.some((e) => e.key.startsWith('log.invasion') || e.key.startsWith('log.bombard'))) {
    play('battle');
  } else if (newEntries.some((e) => e.kind === 'good')) {
    play('good');
  } else {
    play('day');
  }
  render();
}

function handleAction(el: HTMLElement): void {
  const action = el.dataset.action!;

  if (action === 'lang') {
    setLang(el.dataset.lang === 'en' ? 'en' : 'sv');
    render();
    return;
  }
  if (action === 'sound') {
    toggleMuted();
    render();
    return;
  }
  if (action === 'help') {
    ui.showHelp = !ui.showHelp;
    render();
    return;
  }
  if (action === 'tutorial') {
    startTutorial();
    render();
    return;
  }
  if (action === 'start') {
    ui.state = newGame(Number(el.dataset.difficulty) as Difficulty);
    ui.selectedPlanet = 0;
    ui.showStats = false;
    ui.tutorial = null;
    ui.dirty = true;
    play('title');
    render();
    return;
  }
  if (action === 'load') {
    const loaded = readSave(el.dataset.slot === 'auto' ? AUTOSAVE_KEY : SAVE_KEY);
    if (loaded) {
      ui.state = loaded;
      ui.selectedPlanet = 0;
      ui.showStats = false;
      ui.tutorial = null;
      ui.dirty = false;
    }
    render();
    return;
  }
  if (action === 'quit') {
    if (ui.state && ui.state.status === 'playing') {
      if (ui.dirty && !window.confirm(t('ui.confirmQuit'))) return;
      autosave(ui.state);
    }
    ui.state = null;
    ui.showStats = false;
    ui.showHelp = false;
    ui.tutorial = null;
    render();
    return;
  }
  if (action === 'tut-next') {
    if (ui.state && ui.tutorial !== null) advanceTutorial(ui.state);
    render();
    return;
  }
  if (action === 'tut-skip') {
    ui.tutorial = null;
    render();
    return;
  }

  const s = ui.state;
  if (!s) return;

  switch (action) {
    case 'save':
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      ui.dirty = false;
      showToast(t('ui.saved'), false);
      break;
    case 'stats':
      ui.showStats = !ui.showStats;
      render();
      break;
    case 'end-day': {
      const before = s.log.length;
      game.endDay(s);
      afterDays(s, before);
      break;
    }
    case 'end-week': {
      const before = s.log.length;
      for (let i = 0; i < 5 && s.status === 'playing'; i++) game.endDay(s);
      afterDays(s, before);
      break;
    }
    case 'select':
      ui.selectedPlanet = Number(el.dataset.id);
      render();
      break;
    case 'build':
      act(game.build(s, ui.selectedPlanet, el.dataset.building as Building));
      break;
    case 'buy-battle':
      act(game.buyShip(s, 'battleCruiser'));
      break;
    case 'buy-cargo':
      act(game.buyShip(s, 'cargoCruiser'));
      break;
    case 'send-processor':
      act(game.sendProcessor(s, ui.selectedPlanet));
      break;
    case 'send-outpost':
      act(game.sendOutpost(s, ui.selectedPlanet));
      break;
    case 'send-probe':
      act(game.sendProbe(s, ui.selectedPlanet));
      break;
    case 'bombard':
      act(game.bombard(s, ui.selectedPlanet, num('bombard-count')));
      break;
    case 'train':
      act(game.trainTroops(s, ui.selectedPlanet, num('train-count')));
      break;
    case 'send-troops':
      act(game.sendTroops(s, ui.selectedPlanet, sel('troop-target'), num('troop-count')));
      break;
    case 'send-cargo':
      act(
        game.sendCargo(s, ui.selectedPlanet, sel('cargo-target'), {
          food: Math.max(0, num('cargo-food')),
          energy: Math.max(0, num('cargo-energy')),
          minerals: Math.max(0, num('cargo-minerals')),
        }),
      );
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
    if (ui.state && ui.state.status === 'playing' && ui.dirty) {
      autosave(ui.state);
      e.preventDefault();
    }
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
