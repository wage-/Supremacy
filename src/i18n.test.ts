import { afterEach, describe, expect, it } from 'vitest';
import { getLang, setLang, t } from './i18n';

describe('i18n', () => {
  afterEach(() => setLang('sv'));

  it('interpolerar parametrar', () => {
    expect(t('ui.continueSave', { day: 7 })).toContain('7');
  });

  it('@-parametrar översätts rekursivt', () => {
    setLang('en');
    expect(t('log.personalityHint', { style: '@style.economist' })).toContain('methodical economist');
  });

  it('okända nycklar faller tillbaka till nyckeln', () => {
    expect(t('finns.inte')).toBe('finns.inte');
  });

  it('byter språk', () => {
    expect(t('ui.nextDay')).toContain('Nästa dag');
    setLang('en');
    expect(getLang()).toBe('en');
    expect(t('ui.nextDay')).toContain('Next day');
  });
});
