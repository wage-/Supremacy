export type Lang = 'sv' | 'en';

const LANG_KEY = 'supremacy-lang';

let current: Lang = 'sv';
try {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === 'en' || stored === 'sv') current = stored;
} catch {
  // localStorage saknas (t.ex. i tester utan DOM) — kör svenska.
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignorera
  }
}

type Dict = Record<string, string>;

const sv: Dict = {
  // Startskärm
  'ui.tagline': 'DIN VILJA SKE',
  'ui.chooseSystem': 'Välj stjärnsystem:',
  'ui.planets': 'planeter',
  'ui.against': 'mot',
  'ui.continueSave': 'Fortsätt sparat spel (dag {day})',
  'ui.continueAutosave': 'Fortsätt autospar (dag {day})',
  'ui.highscores': 'Topplista',
  'ui.noHighscores': 'Inga vinster ännu.',
  'ui.hsEntry': '{system} ({label}) — vann på {days} dagar',
  'ui.systemName': '{name}-systemet',

  // Svårighetsgrader
  'diff.0': 'Lätt',
  'diff.1': 'Normal',
  'diff.2': 'Svår',
  'diff.3': 'Omöjlig',
  'opp.0': 'General Hraak',
  'opp.1': 'Övermästare Zorn',
  'opp.2': 'Kejsar Vekk',
  'opp.3': 'Hivemind Qor',

  // Topprad
  'ui.day': 'Dag',
  'ui.credits': 'Krediter',
  'ui.fuel': 'Bränsle',
  'ui.battleCruisers': 'Stridskryssare',
  'ui.cargoCruisers': 'Kargolastare',
  'ui.nextDay': 'Nästa dag ▸',
  'ui.next5Days': '+5 dagar ▸▸',
  'ui.save': 'Spara',
  'ui.menu': 'Huvudmeny',
  'ui.stats': 'Statistik',
  'ui.sound': 'Ljud',

  // Resurser
  'res.food': 'Mat',
  'res.energy': 'Energi',
  'res.minerals': 'Mineraler',
  'res.fuel': 'Bränsle',

  // Byggnader
  'b.mine': 'Gruvstation',
  'b.farm': 'Odlingsstation',
  'b.solarSat': 'Solsatellit',
  'b.defense': 'Orbitalförsvar',

  // Planetlista/detaljer
  'ui.terraformingShort': 'terraformas {days} d',
  'ui.barren': 'karg',
  'ui.outpostShort': 'utpost',
  'ui.owner': 'Ägare',
  'ui.ownerYou': 'Din',
  'ui.ownerEnemy': 'Fiende',
  'ui.ownerNeutral': 'Neutral',
  'ui.status': 'Status',
  'ui.statusTerraforming': 'Terraformas ({days} dagar kvar)',
  'ui.statusHabitable': 'Beboelig',
  'ui.statusBarren': 'Karg',
  'ui.statusOutpost': 'Gruvutpost',
  'ui.population': 'Befolkning',
  'ui.morale': 'Moral',
  'ui.troops': 'Trupper',
  'ui.mines': 'Gruvor',
  'ui.farms': 'Odlingar',
  'ui.solarSats': 'Solsatelliter',
  'ui.defense': 'Orbitalförsvar',
  'ui.richness': 'Mineralrikedom',
  'ui.fertility': 'Bördighet',
  'ui.solarFlux': 'Solinstrålning',
  'ui.localStocks': 'Lokala lager',
  'ui.unknown': 'okänt',
  'ui.scouted': 'spanad t.o.m. dag {day}',
  'ui.millions': '{n} milj',
  'ui.thousands': '{n} tusen',

  // Handlingar
  'ui.build': 'Bygg {name}',
  'ui.train': 'Värva trupper',
  'ui.trainCost': '{credits} kr + {energy} energi per man (tas ur befolkningen)',
  'ui.tax': 'Skatt',
  'ui.sendTroops': 'Skicka trupper',
  'ui.to': 'till',
  'ui.sendCargo': 'Skicka frakt',
  'ui.cargoHint': '1 kargolastare per {cap} enheter. Restid och bränsle beror på avstånd.',
  'ui.deployProcessor': 'Skicka atmosfärprocessor',
  'ui.deployOutpost': 'Skicka gruvutpost',
  'ui.sendProbe': 'Skicka spionsond',
  'ui.bombard': 'Bombardera',
  'ui.bombardHint': 'Skickar stridskryssare som beskjuter försvar och trupper från omloppsbana.',
  'ui.troopHint': '1 stridskryssare per {cap} man. Restid och bränsle beror på avstånd.',
  'ui.enemyPlanetHint': 'Fientlig planet — skicka trupper från en av dina planeter, eller spana/bombardera.',
  'ui.shipyard': 'Skeppsvarv',
  'ui.buyBattleCruiser': 'Köp stridskryssare',
  'ui.buyCargoCruiser': 'Köp kargolastare',
  'ui.market': 'Galaktisk marknad (Starbase)',
  'ui.marketHint': 'Handeln sker via hemplanetens lager.',
  'ui.buy': 'Köp',
  'ui.sell': 'Sälj',
  'ui.log': 'Logg',
  'ui.missions': 'Flottrörelser',
  'ui.noMissions': 'Inga flottor i rörelse.',
  'ui.missionDays': '{days} d kvar',
  'ui.unknownFleet': 'Okänd flotta mot {planet}',
  'm.move': 'Trupptransport till {planet}',
  'm.invade': 'Invasionsstyrka mot {planet}',
  'm.cargo': 'Frakt till {planet}',
  'm.processor': 'Atmosfärprocessor till {planet}',
  'm.outpost': 'Utpostkonvoj till {planet}',
  'm.probe': 'Spionsond mot {planet}',
  'm.bombard': 'Bombardemang mot {planet}',

  // Statistik
  'ui.statsTitle': 'Statistik — dag {day}',
  'ui.statsCredits': 'Krediter',
  'ui.statsTroops': 'Trupper (totalt)',
  'ui.statsPlanets': 'Planeter',
  'ui.you': 'Du',
  'ui.enemy': 'Fienden',
  'ui.close': 'Stäng',

  // Slutskärm
  'ui.victory': 'SUPREMACY!',
  'ui.defeat': 'NEDERLAG',
  'ui.wonText': 'Du krossade {opponent} på dag {day}.',
  'ui.lostText': '{opponent} intog Starbase på dag {day}.',
  'ui.backToMenu': 'Tillbaka till huvudmenyn',

  // Dialoger/meddelanden
  'ui.confirmQuit': 'Avsluta utan att spara? Senaste autospar finns kvar i huvudmenyn.',
  'ui.saved': 'Spelet sparat.',

  // Fel
  'err.amount': 'Ange en positiv mängd.',
  'err.credits': 'Inte tillräckligt med krediter.',
  'err.minerals': 'Inte tillräckligt med mineraler på {planet}.',
  'err.energy': 'Inte tillräckligt med energi på {planet}.',
  'err.notYours': 'Planeten tillhör inte dig.',
  'err.needHabitable': 'Planeten måste terraformas först.',
  'err.noFarmsOnOutpost': 'Odlingar kräver en terraformad planet.',
  'err.notNeutral': 'Planeten är inte neutral.',
  'err.alreadyTerraforming': 'Planeten terraformas redan.',
  'err.alreadyIncoming': 'En konvoj är redan på väg dit.',
  'err.notEnoughStock': 'Så mycket finns inte i lager.',
  'err.notEnoughTroops': 'Så många trupper finns inte här.',
  'err.population': 'För liten befolkning för att värva fler.',
  'err.taxRange': 'Skatten måste vara 0–100 %.',
  'err.sameTarget': 'Välj en annan destination.',
  'err.needBattleCruisers': 'Kräver {n} stridskryssare (du har {have}).',
  'err.needCargoCruisers': 'Kräver {n} kargolastare (du har {have}).',
  'err.needFuel': 'Kräver {n} bränsle (du har {have}).',
  'err.targetEnemy': 'Målet måste vara fiendens planet.',
  'err.targetOwn': 'Målet måste vara en av dina planeter.',
  'err.noCruisers': 'Ange hur många stridskryssare som ska skickas.',

  // Logg
  'log.arrival': 'Du anländer till {system}-systemet. {opponent} härskar från fästet {fortress}. Erövra det — eller gå under.',
  'log.personalityHint': 'Underrättelser: motståndaren beskrivs som {style}.',
  'style.aggressor': 'hänsynslöst aggressiv',
  'style.economist': 'en metodisk ekonom',
  'style.expander': 'en glupsk expansionist',
  'log.processorSent': 'Atmosfärprocessor på väg till {planet} ({days} dagars resa).',
  'log.outpostSent': 'Utpostkonvoj på väg till {planet} ({days} dagars resa).',
  'log.colonised': '{planet} är terraformad! Kolonister har landat.',
  'log.colonisedEnemy': 'Fienden har koloniserat {planet}.',
  'log.outpostEstablished': 'Gruvutpost etablerad på {planet}.',
  'log.outpostEstablishedEnemy': 'Fienden har etablerat en utpost på {planet}.',
  'log.starvation': 'Svält på {planet}! Befolkningen minskar.',
  'log.desertion': 'Trupperna på {planet} saknar mat — soldater deserterar.',
  'log.troopsArrived': '{count} man har anlänt till {planet}.',
  'log.cargoArrived': 'Frakt har levererats till {planet}.',
  'log.cargoLost': 'Frakten till {planet} gick förlorad — planeten är i fiendens händer.',
  'log.invasionWonPlayer': 'Dina styrkor erövrade {planet}! (förluster: {lostA} egna, {lostD} fiender)',
  'log.invasionLostPlayer': 'Anfallet mot {planet} slogs tillbaka. {lostA} man förlorade.',
  'log.invasionWonEnemy': 'Fienden har erövrat {planet}! {lostD} försvarare föll.',
  'log.invasionRepelled': 'Invasion mot {planet} tillbakaslagen! Fienden förlorade {lostA} man.',
  'log.probeReport': 'Sondrapport från {planet}: {troops} trupper, {defense} försvarsbatterier.',
  'log.bombardment': 'Bombardemang av {planet}: {defenseDestroyed} batterier och {troopsKilled} trupper utslagna ({cruisersLost} kryssare förlorade).',
  'log.bombardmentEnemy': 'Fienden bombarderade {planet}: {defenseDestroyed} batterier och {troopsKilled} trupper utslagna.',
  'log.enemyFleetSpotted': 'Okänd fientlig flotta upptäckt — kurs mot {planet}, framme om {days} dagar.',
  'log.win': 'Fiendens fäste har fallit. Systemet är ditt — SUPREMACY!',
  'log.lose': 'Starbase har fallit. Ditt välde är över.',
  'log.event.pirates': 'Pirater plundrade en konvoj — {credits} krediter förlorade.',
  'log.event.solarStorm': 'Solstorm över {planet}! {sats} solsatelliter utslagna.',
  'log.event.epidemic': 'Epidemi på {planet} — befolkningen och moralen sjunker.',
  'log.event.mineralStrike': 'Rik mineralåder funnen på {planet}! +{amount} mineraler.',
  'log.event.marketUp': 'Marknadsoro: priset på {resource} har stigit kraftigt.',
  'log.event.marketDown': 'Överskott på marknaden: priset på {resource} har rasat.',
};

const en: Dict = {
  'ui.tagline': 'YOUR WILL BE DONE',
  'ui.chooseSystem': 'Choose a star system:',
  'ui.planets': 'planets',
  'ui.against': 'vs',
  'ui.continueSave': 'Continue saved game (day {day})',
  'ui.continueAutosave': 'Continue autosave (day {day})',
  'ui.highscores': 'Hall of Fame',
  'ui.noHighscores': 'No victories yet.',
  'ui.hsEntry': '{system} ({label}) — won in {days} days',
  'ui.systemName': '{name} System',

  'diff.0': 'Easy',
  'diff.1': 'Normal',
  'diff.2': 'Hard',
  'diff.3': 'Impossible',
  'opp.0': 'General Hraak',
  'opp.1': 'Overlord Zorn',
  'opp.2': 'Emperor Vekk',
  'opp.3': 'Hivemind Qor',

  'ui.day': 'Day',
  'ui.credits': 'Credits',
  'ui.fuel': 'Fuel',
  'ui.battleCruisers': 'Battle cruisers',
  'ui.cargoCruisers': 'Cargo cruisers',
  'ui.nextDay': 'Next day ▸',
  'ui.next5Days': '+5 days ▸▸',
  'ui.save': 'Save',
  'ui.menu': 'Main menu',
  'ui.stats': 'Statistics',
  'ui.sound': 'Sound',

  'res.food': 'Food',
  'res.energy': 'Energy',
  'res.minerals': 'Minerals',
  'res.fuel': 'Fuel',

  'b.mine': 'Mining station',
  'b.farm': 'Horticultural station',
  'b.solarSat': 'Solar satellite',
  'b.defense': 'Orbital defense',

  'ui.terraformingShort': 'terraforming {days} d',
  'ui.barren': 'barren',
  'ui.outpostShort': 'outpost',
  'ui.owner': 'Owner',
  'ui.ownerYou': 'Yours',
  'ui.ownerEnemy': 'Enemy',
  'ui.ownerNeutral': 'Neutral',
  'ui.status': 'Status',
  'ui.statusTerraforming': 'Terraforming ({days} days left)',
  'ui.statusHabitable': 'Habitable',
  'ui.statusBarren': 'Barren',
  'ui.statusOutpost': 'Mining outpost',
  'ui.population': 'Population',
  'ui.morale': 'Morale',
  'ui.troops': 'Troops',
  'ui.mines': 'Mines',
  'ui.farms': 'Farms',
  'ui.solarSats': 'Solar satellites',
  'ui.defense': 'Orbital defense',
  'ui.richness': 'Mineral richness',
  'ui.fertility': 'Fertility',
  'ui.solarFlux': 'Solar flux',
  'ui.localStocks': 'Local stores',
  'ui.unknown': 'unknown',
  'ui.scouted': 'scouted until day {day}',
  'ui.millions': '{n} M',
  'ui.thousands': '{n} k',

  'ui.build': 'Build {name}',
  'ui.train': 'Recruit troops',
  'ui.trainCost': '{credits} cr + {energy} energy per soldier (drawn from population)',
  'ui.tax': 'Tax',
  'ui.sendTroops': 'Send troops',
  'ui.to': 'to',
  'ui.sendCargo': 'Send cargo',
  'ui.cargoHint': '1 cargo cruiser per {cap} units. Travel time and fuel depend on distance.',
  'ui.deployProcessor': 'Send atmosphere processor',
  'ui.deployOutpost': 'Send mining outpost',
  'ui.sendProbe': 'Send spy probe',
  'ui.bombard': 'Bombard',
  'ui.bombardHint': 'Sends battle cruisers to shell defenses and troops from orbit.',
  'ui.troopHint': '1 battle cruiser per {cap} soldiers. Travel time and fuel depend on distance.',
  'ui.enemyPlanetHint': 'Enemy planet — send troops from one of your planets, or scout/bombard.',
  'ui.shipyard': 'Shipyard',
  'ui.buyBattleCruiser': 'Buy battle cruiser',
  'ui.buyCargoCruiser': 'Buy cargo cruiser',
  'ui.market': 'Galactic market (Starbase)',
  'ui.marketHint': 'Trade flows through your home planet stores.',
  'ui.buy': 'Buy',
  'ui.sell': 'Sell',
  'ui.log': 'Log',
  'ui.missions': 'Fleet movements',
  'ui.noMissions': 'No fleets in transit.',
  'ui.missionDays': '{days} d left',
  'ui.unknownFleet': 'Unknown fleet heading for {planet}',
  'm.move': 'Troop transport to {planet}',
  'm.invade': 'Invasion force against {planet}',
  'm.cargo': 'Cargo run to {planet}',
  'm.processor': 'Atmosphere processor to {planet}',
  'm.outpost': 'Outpost convoy to {planet}',
  'm.probe': 'Spy probe to {planet}',
  'm.bombard': 'Bombardment of {planet}',

  'ui.statsTitle': 'Statistics — day {day}',
  'ui.statsCredits': 'Credits',
  'ui.statsTroops': 'Troops (total)',
  'ui.statsPlanets': 'Planets',
  'ui.you': 'You',
  'ui.enemy': 'Enemy',
  'ui.close': 'Close',

  'ui.victory': 'SUPREMACY!',
  'ui.defeat': 'DEFEAT',
  'ui.wonText': 'You crushed {opponent} on day {day}.',
  'ui.lostText': '{opponent} seized your Starbase on day {day}.',
  'ui.backToMenu': 'Back to main menu',

  'ui.confirmQuit': 'Quit without saving? Your latest autosave remains in the main menu.',
  'ui.saved': 'Game saved.',

  'err.amount': 'Enter a positive amount.',
  'err.credits': 'Not enough credits.',
  'err.minerals': 'Not enough minerals on {planet}.',
  'err.energy': 'Not enough energy on {planet}.',
  'err.notYours': 'That planet is not yours.',
  'err.needHabitable': 'The planet must be terraformed first.',
  'err.noFarmsOnOutpost': 'Farms require a terraformed planet.',
  'err.notNeutral': 'The planet is not neutral.',
  'err.alreadyTerraforming': 'The planet is already being terraformed.',
  'err.alreadyIncoming': 'A convoy is already en route there.',
  'err.notEnoughStock': 'Not enough in store.',
  'err.notEnoughTroops': 'Not that many troops stationed here.',
  'err.population': 'Population too small to recruit more.',
  'err.taxRange': 'Tax must be 0–100 %.',
  'err.sameTarget': 'Choose a different destination.',
  'err.needBattleCruisers': 'Requires {n} battle cruisers (you have {have}).',
  'err.needCargoCruisers': 'Requires {n} cargo cruisers (you have {have}).',
  'err.needFuel': 'Requires {n} fuel (you have {have}).',
  'err.targetEnemy': 'The target must be an enemy planet.',
  'err.targetOwn': 'The target must be one of your planets.',
  'err.noCruisers': 'Specify how many battle cruisers to send.',

  'log.arrival': 'You arrive in the {system} System. {opponent} rules from the fortress {fortress}. Conquer it — or perish.',
  'log.personalityHint': 'Intelligence: the opponent is described as {style}.',
  'style.aggressor': 'ruthlessly aggressive',
  'style.economist': 'a methodical economist',
  'style.expander': 'a voracious expansionist',
  'log.processorSent': 'Atmosphere processor en route to {planet} ({days} day journey).',
  'log.outpostSent': 'Outpost convoy en route to {planet} ({days} day journey).',
  'log.colonised': '{planet} has been terraformed! Colonists have landed.',
  'log.colonisedEnemy': 'The enemy has colonised {planet}.',
  'log.outpostEstablished': 'Mining outpost established on {planet}.',
  'log.outpostEstablishedEnemy': 'The enemy has established an outpost on {planet}.',
  'log.starvation': 'Famine on {planet}! The population is shrinking.',
  'log.desertion': 'Troops on {planet} are out of food — soldiers are deserting.',
  'log.troopsArrived': '{count} troops have arrived at {planet}.',
  'log.cargoArrived': 'Cargo delivered to {planet}.',
  'log.cargoLost': 'The cargo bound for {planet} was lost — the planet is in enemy hands.',
  'log.invasionWonPlayer': 'Your forces captured {planet}! (losses: {lostA} own, {lostD} enemy)',
  'log.invasionLostPlayer': 'The assault on {planet} was repelled. {lostA} troops lost.',
  'log.invasionWonEnemy': 'The enemy has captured {planet}! {lostD} defenders fell.',
  'log.invasionRepelled': 'Invasion of {planet} repelled! The enemy lost {lostA} troops.',
  'log.probeReport': 'Probe report from {planet}: {troops} troops, {defense} defense batteries.',
  'log.bombardment': 'Bombardment of {planet}: {defenseDestroyed} batteries and {troopsKilled} troops destroyed ({cruisersLost} cruisers lost).',
  'log.bombardmentEnemy': 'The enemy bombarded {planet}: {defenseDestroyed} batteries and {troopsKilled} troops destroyed.',
  'log.enemyFleetSpotted': 'Unknown hostile fleet detected — heading for {planet}, arrival in {days} days.',
  'log.win': 'The enemy fortress has fallen. The system is yours — SUPREMACY!',
  'log.lose': 'Starbase has fallen. Your reign is over.',
  'log.event.pirates': 'Pirates raided a convoy — {credits} credits lost.',
  'log.event.solarStorm': 'Solar storm over {planet}! {sats} solar satellites destroyed.',
  'log.event.epidemic': 'Epidemic on {planet} — population and morale are falling.',
  'log.event.mineralStrike': 'Rich mineral vein found on {planet}! +{amount} minerals.',
  'log.event.marketUp': 'Market unrest: the price of {resource} has surged.',
  'log.event.marketDown': 'Market glut: the price of {resource} has collapsed.',
};

const dicts: Record<Lang, Dict> = { sv, en };

/** Slå upp en nyckel och interpolera {param}-platshållare.
 * Parametervärden som börjar med '@' tolkas som i18n-nycklar och översätts
 * rekursivt — så att sparade loggposter byter språk med UI:t. */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = dicts[current][key] ?? dicts.sv[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      const value = typeof v === 'string' && v.startsWith('@') ? t(v.slice(1)) : String(v);
      text = text.replaceAll(`{${k}}`, value);
    }
  }
  return text;
}
