import type { Difficulty } from './game/types';

const KEY = 'supremacy-highscores';

export interface Highscore {
  date: string;
  difficulty: Difficulty;
  systemName: string;
  days: number;
}

export function loadHighscores(): Highscore[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Highscore[]) : [];
  } catch {
    return [];
  }
}

/** Högre svårighetsgrad slår fler dagar; snabbare vinst slår långsammare. */
export function addHighscore(entry: Highscore): void {
  const list = loadHighscores();
  list.push(entry);
  list.sort((a, b) => b.difficulty - a.difficulty || a.days - b.days);
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)));
  } catch {
    // ignorera
  }
}
