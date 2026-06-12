# Supremacy

En webbaserad hyllning till 90-talsklassikern **Supremacy: Your Will Be Done**
(även känt som *Overlord*) — ett rymdstrategispel om terraformning, ekonomi
och erövring.

## Spelet

Du tävlar mot en utomjordisk härskare om kontrollen över ett stjärnsystem.
Vinn genom att erövra fiendens hemplanet — förlora om din Starbas faller.

- **Terraforma** neutrala planeter med atmosfärprocessorer (12 dagar)
- **Bygg** gruvstationer, odlingsstationer, solsatelliter och orbitalförsvar
- **Hantera ekonomin**: mat, energi, mineraler, bränsle och skattetryck —
  hög skatt ger krediter men sänker moralen och tillväxten
- **Handla** på den galaktiska marknaden (köp dyrt, sälj billigt)
- **Värva trupper** ur befolkningen, köp stridskryssare och invadera
- Fyra stjärnsystem med stigande svårighetsgrad, precis som i originalet

Spelet är turordningsbaserat: tryck **Nästa dag** så rullar produktion,
befolkning, terraformning och fiendens drag. Spara/ladda via `localStorage`.

## Kom igång

```bash
npm install
npm run dev      # startar utvecklingsserver
npm test         # kör enhetstester (Vitest)
npm run build    # typkontroll + produktionsbygge till dist/
```

## Struktur

```
src/
  game/        Ren spellogik utan DOM-beroenden
    types.ts   Datamodell (GameState, Planet, Faction …)
    data.ts    Balans: kostnader, produktion, svårighetsgrader
    state.ts   Nytt spel, logg, hjälpfunktioner
    economy.ts Produktion, skatt, befolkning, terraformning
    combat.ts  Invasionsstrider
    ai.ts      Fiendens dagliga beslut
    game.ts    Spelarhandlingar + dagsväxling
  ui.ts        Menystyrd DOM-rendering (svenska)
  main.ts      Uppstart
```

Spellogiken är deterministisk givet ett RNG-frö, vilket gör den lätt att testa.

`sim.ts` är ett fristående balansverktyg som spelar spelet med en girig
strategi på alla svårighetsgrader: `npx vite-node sim.ts`.
