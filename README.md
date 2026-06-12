# Supremacy

En webbaserad hyllning till 90-talsklassikern **Supremacy: Your Will Be Done**
(även känt som *Overlord*) — ett rymdstrategispel om terraformning, ekonomi,
logistik och erövring. Spelet finns på **svenska och engelska** (växla med
SV/EN-knapparna).

## Spelet

Du tävlar mot en utomjordisk härskare om kontrollen över ett stjärnsystem.
Vinn genom att erövra fiendens hemfäste — förlora om din Starbase faller.

- **Terraforma** neutrala planeter med atmosfärprocessorer, eller etablera
  **gruvutposter** på karga, mineralrika världar
- **Logistik som i originalet**: resurser lagras lokalt per planet och
  fraktas med kargolastare; flottor har **restid** och bränslekostnad som
  beror på avståndet
- **Hantera ekonomin**: mat, energi, mineraler, skattetryck och moral —
  trupper utan mat deserterar
- **Handla** på den galaktiska marknaden, där priserna svänger med händelser
- **Krig**: värva trupper, köp stridskryssare, **spana** med sonder (fiendens
  styrkor är dolda annars), **bombardera** från omloppsbana och invadera
- **Slumphändelser**: pirater, solstormar, epidemier, mineralfynd
- Fyra stjärnsystem med stigande svårighetsgrad och **tre AI-personligheter**
  (aggressorn, ekonomen, expansionisten) som slumpas varje parti
- **Systemkarta** med omloppsbanor och flottrörelser, **statistikskärm** med
  grafer, **topplista**, retro-ljudeffekter (WebAudio) och mobilanpassad layout

Spelet är turordningsbaserat: tryck **Nästa dag** så rullar produktion,
flottor, terraformning och fiendens drag. Sparas via `localStorage`:
en manuell slot plus ett **autospar** efter varje handling.

## Spela direkt i webbläsaren

Repot innehåller ett GitHub Actions-arbetsflöde som publicerar spelet på
**GitHub Pages** vid varje push till `main`. Aktivera det en gång i repo-
inställningarna: *Settings → Pages → Source: GitHub Actions*.

## Kom igång lokalt

Ny dator utan verktyg? Följ den detaljerade guiden i **[INSTALL.md](INSTALL.md)**
(installerar Git + Node.js från noll på Windows/macOS/Linux).

Har du redan Git och Node.js 20+:

```bash
git clone https://github.com/wage-/Supremacy.git
cd Supremacy
npm install
npm run dev      # startar utvecklingsserver — öppna adressen som visas
npm test         # kör enhetstester (Vitest)
npm run build    # typkontroll + produktionsbygge till dist/
```

## Struktur

```
src/
  game/          Ren spellogik utan DOM-beroenden
    types.ts     Datamodell (GameState, Planet, Mission …)
    data.ts      Balans: kostnader, restider, svårighetsgrader, AI-personligheter
    state.ts     Nytt spel, logg, hjälpfunktioner
    economy.ts   Produktion, skatt, befolkning, terraformning (lokala lager)
    combat.ts    Invasioner och bombardemang
    missions.ts  Flottuppdrag med restid (trupper, frakt, konvojer, sonder)
    events.ts    Slumphändelser och marknadssvängningar
    ai.ts        Fiendens dagliga beslut (tre personligheter)
    game.ts      Spelarhandlingar + dagsväxling + historik
  i18n.ts        Översättningar (svenska/engelska); loggen lagrar nycklar
  ui.ts          Menystyrd DOM-rendering med SVG-systemkarta
  sound.ts       Chiptune-ljudeffekter via WebAudio
  highscore.ts   Lokal topplista
.github/workflows/deploy.yml   Bygger, testar och publicerar till GitHub Pages
```

Spellogiken är deterministisk givet ett RNG-frö, vilket gör den lätt att testa.

`sim.ts` är ett fristående balansverktyg som spelar spelet med en girig
strategi på alla svårighetsgrader: `npx vite-node sim.ts`.
