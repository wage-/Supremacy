# Installationsguide

> **Tips:** Spelet kan också publiceras på GitHub Pages och spelas direkt i
> webbläsaren utan någon installation alls — se avsnittet *Spela direkt i
> webbläsaren* i [README.md](README.md). Guiden nedan gäller lokal körning
> och utveckling.

Den här guiden tar dig från en helt ren dator (inga utvecklingsverktyg
installerade) till ett körande spel. Den täcker Windows, macOS och Linux.

## 0. Vad som behövs

Spelet är en webbapplikation. För att köra det behöver datorn:

| Verktyg | Varför | Version |
|---|---|---|
| **Node.js** (inkl. npm) | Kör utvecklingsservern och bygger spelet | 20 eller senare (LTS rekommenderas) |
| **Git** | Hämtar koden från GitHub | valfri aktuell version |
| En modern webbläsare | Spelet körs i webbläsaren | Chrome, Firefox, Edge, Safari … |

> **Utan Git?** Du kan hoppa över Git helt: gå till repot på GitHub, klicka
> den gröna **Code**-knappen → **Download ZIP**, packa upp och fortsätt
> från steg 3.

## 1. Installera Git

**Windows**

Öppna *Terminal* (eller PowerShell) och kör:

```powershell
winget install --id Git.Git -e
```

Alternativt: ladda ner installeraren från <https://git-scm.com/download/win>
och klicka igenom med standardvalen. Starta om terminalen efteråt.

**macOS**

Öppna *Terminal* och kör:

```bash
xcode-select --install
```

(Det installerar Apples kommandoradsverktyg, där Git ingår. Har du
[Homebrew](https://brew.sh) går även `brew install git`.)

**Linux (Debian/Ubuntu)**

```bash
sudo apt update && sudo apt install -y git
```

**Linux (Fedora)**

```bash
sudo dnf install -y git
```

Verifiera i alla fall med:

```bash
git --version
```

## 2. Installera Node.js

**Windows**

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Alternativt: ladda ner LTS-installeraren från <https://nodejs.org> och
klicka igenom. Starta om terminalen efteråt.

**macOS / Linux**

Enklast och mest framtidssäkert är versionshanteraren
[nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Stäng och öppna terminalen igen, sedan:
nvm install --lts
```

(På macOS går även `brew install node`, på Ubuntu finns paket via
[NodeSource](https://github.com/nodesource/distributions). Undvik Ubuntus
egna `apt install nodejs` — den versionen är ofta för gammal.)

Verifiera — npm följer med Node automatiskt:

```bash
node --version   # ska visa v20 eller högre
npm --version
```

## 3. Hämta koden

Stå i den mapp där du vill ha projektet och kör:

```bash
git clone https://github.com/wage-/Supremacy.git
cd Supremacy
```

> **Obs:** Ligger spelet ännu inte på `main` utan på en utvecklingsgren,
> checka ut den efter kloningen, t.ex.:
> `git checkout claude/keen-feynman-wq3wn9`

(Laddade du ner ZIP i stället: packa upp och `cd` in i mappen.)

## 4. Installera projektets beroenden

I projektmappen:

```bash
npm install
```

Det laddar ner allt projektet behöver (Vite, TypeScript, Vitest m.m.) till
mappen `node_modules/`. Behöver bara göras en gång, samt efter att
`package.json` ändrats.

## 5. Starta spelet

```bash
npm run dev
```

Terminalen skriver ut en adress, normalt:

```
  ➜  Local:   http://localhost:5173/
```

Öppna den adressen i webbläsaren — välj stjärnsystem och spela!
Stoppa servern med `Ctrl+C` i terminalen.

## 6. Valfritt: tester och produktionsbygge

```bash
npm test           # kör enhetstesterna (Vitest)
npm run build      # typkontroll + optimerat bygge till dist/
npm run preview    # provkör det färdiga bygget lokalt
```

Innehållet i `dist/` är rena statiska filer (HTML/CSS/JS) och kan läggas
på vilken statisk webbserver som helst — GitHub Pages, Netlify, nginx osv.
Ingen Node.js behövs på servern. Bygget använder relativa sökvägar, så det
fungerar även direkt från en undermapp.

## Felsökning

- **`node: command not found` / `npm: command not found`** — Node.js är
  inte installerat eller terminalen är inte omstartad efter installation.
  Gör om steg 2 och öppna ett nytt terminalfönster.
- **Felmeddelanden om Node-version vid `npm install` eller `npm run dev`**
  — din Node är för gammal. Kontrollera med `node --version`; uppgradera
  till senaste LTS (steg 2).
- **Porten 5173 är upptagen** — starta på en annan port:
  `npm run dev -- --port 5174`
- **Företagsnätverk/proxy gör att `npm install` misslyckas** — ställ in
  proxy: `npm config set proxy http://din-proxy:port` (och samma för
  `https-proxy`), eller kör på ett annat nätverk.
- **Spelet sparas inte** — spara/ladda använder webbläsarens
  `localStorage`; privat läge eller blockerad webbplatsdata stoppar det.
