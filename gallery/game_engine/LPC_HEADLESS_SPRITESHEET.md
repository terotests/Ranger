# Headless LPC Spritesheet Builder — suunnitelma

> **Päivitetty:** heinäkuu 2026  
> **Tarkoitus:** suunnitella UI-vapaa LPC-hahmogeneraattori Ranger Game Enginen
> pohjalle — parametri sisään, spritesheet + credits ulos.  
> **Lähteet:** [Universal LPC Spritesheet Character Generator](https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator) (workspace-sibling), [`lpc/`](./lpc/) (toteutushakemisto), [`RENDERING_EVG.md`](./RENDERING_EVG.md), [`ROADMAP.md`](./ROADMAP.md)

---

## Tiivistelmä

LPC-generaattorin ydin on jo **headless-yhteensopiva**: `sources/canvas/renderer.ts`
rakentaa `drawCalls`-listan, lataa PNG-layerit, tekee palettivärityksen ja
kompositoi 832×3456 universal sheet -kankaalle. UI (Mithril) on ohut kuori
tilan ympärillä.

Suositeltu malli Rangerille on **yksi polku**:

1. **Ranger compositor** (`lpc/src/*.rgr`) — käännös `build-lpc.sh` → `tmp/lpc/lpc_compose_runner.js`
2. **Ulkoinen LPC-data** (`LPC_ROOT/spritesheets/`) — ei koodia Ranger-repoon
3. **Myöhemmin:** GameRunner `kind: "sheet"` runtime-kustomointiin

Ei erillistä Node/TS-compositoria `lpc/`-hakemistossa.

**Lisenssi:** generaattorin *koodi* on GPLv3; *taide* on sekoitus CC0/CC-BY/
CC-BY-SA/OGA-BY/GPL. Jos compositor kirjoitetaan Rangeriin ja jaetaan pelin
mukana → **GPLv3 on ok** (käyttäjän valinta), mutta **taideattribuutio** pysyy
erillisenä velvoitteena riippumatta koodilisenssistä.

---

## Nykytila (mitä hyödynnetään)

### LPC-generaattori (TypeScript)

| Moduuli | Rooli | UI-riippuvuus |
|---------|-------|---------------|
| `sources/state/catalog.ts` | item-metadata, layerit, zPos | Ei |
| `sources/state/path.ts` | `spritesheets/...` polkujen resoluutio | Ei |
| `sources/state/palettes.ts` | recolor / matchBodyColor | Ei |
| `sources/state/hash.ts` | selections ↔ URL hash | Ei |
| `sources/state/json.ts` | `character.json` import/export + credits | Ei |
| `sources/canvas/renderer.ts` | drawCalls → canvas composite | **Kyllä** (`HTMLCanvasElement`) |
| `sources/canvas/palette-recolor.ts` | CPU/WebGL palettivaihto | Kyllä (Image/Canvas) |
| `sheet_definitions/` | JSON-metatiedot per item | Ei |
| `spritesheets/` | lähde-PNG:t | Ei |
| `CREDITS.csv` | attribuutiot per tiedosto | Ei |

Sheet-koko: **832 × 3456 px**, frame **64 × 64**, 13 framea/rivi (`constants.ts`).

### Ranger Game Engine

| Moduuli | Rooli | LPC-yhteensopivuus |
|---------|-------|-------------------|
| `framebuffer.rgr` (`SoftCanvas`) | RGBA8888, primitiivit | Tarvitsee **alpha blit** (roadmap 1.2) |
| `game_sprite.rgr` | retained sprites, `bitmap`-ASCII | Laajennettavissa `kind: "sheet"` |
| `game_image_loader.rgr` | JPEG cache + cover blit | **Ei PNG-dekoodausta** vielä |
| `PNGEncoder.rgr` | PNG **enkoodaus** | Dekooderi puuttuu |
| `EVGRasterRenderer` | vektori, TTF, alpha compositing | Bake-vaiheessa vaihtoehto TS-canvasille |

---

## Lisenssianalyysi

### 1. Generaattorin ohjelmakoodi (`LICENSE` = GPLv3)

- Koko repo (TypeScript, skriptit, UI) on **GNU General Public License v3**.
- Jos **substantial** osa `renderer.ts` / `palette-recolor.ts` kopioidaan suoraan
  Ranger-binääriin ja jaetaan yhtenä ohjelmana → johdannaistyö on todennäköisesti
  myös GPLv3 (lähdekoodi jaetaan, sama lisenssi).
- **Turvallinen malli:** LPC-compositor pysyy **erillisenä GPL-työkaluna**
  (CLI / npm-skripti / subprocess). Ranger Game Engine käyttää vain **tulosteita**
  (PNG, JSON-metadata, credits.txt) — kuvat eivät ole GPL-koodin johdannaisia.

### 2. Taide (`spritesheets/`, CREDITS.csv)

Jokaisella PNG:llä on oma lisenssi. Yleisimmät:

| Lisenssi | Attribuutio | Kaupallinen | Deriv. rajoitus | DRM / Steam-huomio |
|----------|-------------|-------------|-----------------|-------------------|
| **CC0** | Ei pakollinen | Kyllä | Ei | OK |
| **CC-BY** | Pakollinen | Kyllä | Ei | Epäselvä DRM-lauseke README:ssä |
| **OGA-BY** | Pakollinen | Kyllä | Ei | DRM sallittu peleissä |
| **CC-BY-SA** | Pakollinen | Kyllä | **SA** — muokatut versiot SA | Epäselvä DRM |
| **GPL 3.0** (taide) | Pakollinen | Kyllä | **GPL** johdannaisille | Vältä tai noudata GPL |

**Käytännön säännöt pelille:**

1. **Aina** jaa `credits.json` / `CREDITS`-pätkä pelin kanssa (Credits-näyttö tai linkki).
2. Käytä `licenseFilter`-parametria poissulkemaan GPL ja halutessa CC-BY-SA
   (esim. Steam-julkaisu, jossa attribuutio halutaan minimoida mutta DRM ok → CC0 + OGA-BY).
3. Generoitu **yhdistelmäsheet** sisältää kaikkien valittujen layerien lisenssit —
   `getAllCredits()` (`sources/utils/credits.ts`) tuottaa tämän jo valmiiksi.
4. **Älä** väitä LPC-tyyliä omaksi — käytä README:n attribuutiomallia.
5. Ranger-native compositorin uudelleentoteutus **samasta datasta** on ok;
   lisenssi koskee käytettyä **taidetta**, ei algoritmia.

### 3. `sheet_definitions/` JSON

Metatiedostot ovat repossa GPLv3:n alla. Niiden **lukeminen polkujen löytämiseksi**
on datakäyttöä; rajoite koskee lähinnä repojen uudelleenjakoa. Käytännössä:
- git submodule / npm-paketti LPC-datasta build-timeen, tai
- pre-bake `dist/lpc-metadata.json` Ranger-repoon (vain polut + zPos, ei PNG:itä).

---

## Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INPUT: LpcBuildRequest (JSON / CLI flags / character.json)              │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
┌───────────────────┐                     ┌───────────────────────────┐
│  Vaihe A (nopea)  │                     │  Vaihe B (myöhemmin)      │
│  lpc-bake (Node)  │                     │  lpc_compositor.rgr       │
│  @napi-rs/canvas  │                     │  SoftCanvas + PNG decode  │
│  + LPC renderer.ts│                     │  + palette CPU            │
└─────────┬─────────┘                     └─────────────┬─────────────┘
          │                                             │
          └──────────────────┬──────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  OUTPUT                                                                  │
│  • spritesheet.png (RGBA, 832×N)                                        │
│  • credits.json (pakollinen attribuutio)                                  │
│  • atlas.json (frameW, frameH, animations: { walk: {row, frames, cycle}})│
│  • valinnainen: character.json (LPC v2 export, toistettavuus)           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Ranger GameRunner runtime                                               │
│  sprites(): { kind:"sheet", path, frameW, frameH, defaultAnim }         │
│  entities.hero.p0 = frame index, p1 = direction row                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Miksi ei suoraan EVG:ää compositoriin?

EVG (`EVGRasterRenderer`) osaa alpha-compositingin ja PNG-enkoodauksen, mutta
LPC-pipeline on **satoja pientä PNG-blittejä z-järjestyksessä** + palettivaihto.
Canvas 2D / TS-renderer on jo testattu ja nopea kehitysvaiheessa. EVG sopii
paremmin **yhden sheetin esikatseluun** tai splash-ruutuihin, ei layer-kompositioon.

Myöhemmin: bake-tulos voidaan validoida `PNGEncoder` + golden-frame -testillä
Rangerissa (pikseliparity TS vs native).

---

## Parametri-API (`LpcBuildRequest`)

Rakennetaan LPC:n olemassa olevan `Selections`-tyypin päälle — sama muoto kuin
`exportStateAsJSON` v2.

```typescript
/** Headless bake — ei UI:ta, ei Mithrilia. */
interface LpcBuildRequest {
  /** Oletus: "male" */
  bodyType: "male" | "female" | "teen" | "child" | "muscular" | "pregnant";

  /**
   * Avain = selection group (type_name), esim. "body", "hair", "torso".
   * Sama rakenne kuin LPC UI / character.json selections.
   */
  selections: Record<string, {
    itemId: string;
    variant?: string | null;
    recolor?: string | null;
    name?: string;
  }>;

  /** Rajaa animaatiot (oletus: kaikki itemeillä tuetut). */
  animations?: string[];

  /** Poissulje lisenssit (esim. ["GPL", "CC-BY-SA"] kaupalliseen buildiin). */
  licenseFilter?: Array<"CC0" | "CC-BY" | "CC-BY-SA" | "OGA-BY" | "GPL">;

  palette?: {
    matchBodyColor?: boolean;   // oletus true
    applyTransparencyMask?: boolean;
  };

  output: {
    /** "universal" = täysi 832×3456 LPC-layout */
    layout: "universal" | "compact" | "single-animation";
    /** compact/single: mikä animaatio (esim. "walk") */
    animation?: string;
    /** compact: 32 tai 64 */
    frameSize?: 32 | 64;
    /** Tulostepolut */
    pngPath: string;
    creditsPath: string;
    atlasPath?: string;
    characterJsonPath?: string;
  };

  /** LPC spritesheets -juuri (oletus: env LPC_SPRITESHEETS_ROOT) */
  assetsRoot?: string;
}
```

### CLI-esimerkit

```bash
# character.json → PNG (LPC UI:sta exportattu)
npm run lpc:bake -- --from character.json --out dist/hero/

# Rakenteinen CLI
npm run lpc:bake -- \
  --body-type female \
  --select body:body:female:light \
  --select hair:long_hair:blonde \
  --select torso:leather_armor \
  --license-filter CC0,OGA-BY,CC-BY \
  --out dist/npc-guard.png \
  --credits dist/npc-guard-credits.json

# Ranger-pelin build-skripti
cd gallery/game_engine && npm run assets:lpc -- --preset koodisampo-hero
```

### `atlas.json` (GameRunner-sopiva)

```json
{
  "frameWidth": 64,
  "frameHeight": 64,
  "sheetWidth": 832,
  "sheetHeight": 3456,
  "directions": ["up", "left", "down", "right"],
  "animations": {
    "walk": {
      "row": 8,
      "frameCount": 9,
      "cycle": [0, 1, 2, 3, 4, 5, 6, 7, 8]
    },
    "slash": { "row": 12, "frameCount": 6, "cycle": [0, 1, 2, 3, 4, 5, 4, 3, 2] }
  }
}
```

Rivit ja syklit tulevat suoraan LPC:n `ANIMATION_CONFIGS` / `ANIMATION_OFFSETS`
(`sources/state/constants.ts`) — ei tarvitse keksiä uudestaan.

---

## Toteutusvaiheet

### Vaihe 1 — `lpc-bake` (Node, ~1–2 pv)

**Sijainti:** `gallery/game_engine/lpc/` (tai sibling-repo submodule-linkki)

| Tiedosto | Rooli |
|----------|-------|
| `lpc/bake-cli.mjs` | argv / JSON → `LpcBuildRequest` |
| `lpc/bake-headless.ts` | `@napi-rs/canvas` polyfill, kutsuu `renderCharacter` |
| `lpc/write-atlas.ts` | `ANIMATION_OFFSETS` → `atlas.json` |
| `lpc/license-filter.ts` | tarkista selections `CREDITS.csv`:ää vasten |

**Työlista:**

1. Lisää `LPC_SPRITESHEETS_ROOT` → osoittaa Universal-LPC.../spritesheets
2. Aja `generate_sources.js` metadata ennen bakea (sama kuin Vite)
3. `initCanvas()` + `renderCharacter(selections, bodyType)` → `canvas.toBuffer("image/png")`
4. Kirjoita `credits.json` = `getAllCredits(catalog, selections, bodyType)`
5. Vitest: golden PNG hash yhdelle tunnetulle `character.json` fixturelle
6. `package.json` script: `"lpc:bake": "node lpc/bake-cli.mjs"`

**Ei tarvita:** Mithril, Bulma, selain, Vite dev server.

### Vaihe 2 — GameRunner `kind: "sheet"` (~2–3 pv)

Riippuu roadmapista **1.2 sprite atlas + blit** ja **PNG decode**.

| Tiedosto | Muutos |
|----------|--------|
| `game_image_loader.rgr` | `decodePng` (tai `ImageUtils` laajennus) |
| `framebuffer.rgr` | `blitRgba(src, sx, sy, sw, sh, dx, dy, alpha)` |
| `game_sprite.rgr` | uusi kind `sheet`: cache frame, `p0`=frame, `p1`=dir |
| `game.d.ts` | `SpriteKind` + `SheetSpriteDef` |
| `scripting/lpc_hero.game.tsx` | demo: walk-animaatio sheetistä |

**Entity pose:**

```typescript
entities.hero = { x: 120, y: 80, p0: 2, p1: 2 }; // frame 2, direction down
```

### Vaihe 3 — Ranger-native compositor (valinnainen, ~1–2 vk)

Vain jos tarvitaan bake ilman Nodea (Pi CI, offline).

| Moduuli | Portattava logiikka |
|---------|---------------------|
| `lpc_catalog.rgr` | lue pre-baked `lpc-metadata.json` (itemId → layers, zPos, paths) |
| `lpc_palette.rgr` | CPU `buildColorMap` + tolerance match (`palette-recolor.ts`) |
| `lpc_compositor.rgr` | sort by zPos, blit layer PNG frame (sx,sy) → (dx,dy) |
| `lpc_bake.rgr` | CLI: `lpc_bake(requestJsonPath, outDir)` |

Metadata generoidaan buildissa TS:stä → staattinen JSON Ranger-repoon (ei koko
CREDITS.csv runtimeen).

### Vaihe 4 — Peli-integraatio (Koodisampo tms.)

```bash
# Pelin build
npm run assets:lpc -- --preset player
npm run engine:game-sdl:run -- scripting/koodisampo_rpg.game.tsx
```

Peliin mukaan:
- `assets/sprites/player.png` + `player-atlas.json` + `player-credits.json`
- Settings/Credits-näyttö lukee `player-credits.json`
- CI varmistaa: `licenseFilter` ei riko kaupallista profiilia

---

## Testaus

| Testi | Mitä varmistaa |
|-------|----------------|
| LPC `tests/canvas/renderer*.js` | olemassa oleva drawCalls-logiikka |
| `lpc/bake-golden.test.ts` | bake output === fixture PNG (hash) |
| `tests/lpc-atlas.test.ts` | atlas.json rivit = ANIMATION_OFFSETS |
| `tests/game-sheet-sprite.test.ts` | GameRunner piirtää yhden walk-framen |
| License filter unit test | GPL-item hylätään kun filter aktiivinen |

---

## Riskit ja päätökset

| Riski | Ratkaisu |
|-------|----------|
| GPL-koodi Ranger-binääriin | Erillinen `lpc-bake` CLI, ei linkitystä |
| CC-BY-SA layer kaupallisessa pelissä | `licenseFilter` + dokumentoitu preset |
| PNG decode puuttuu Rangerista | Vaihe 1 tuottaa PNG; vaihe 2 lisää dekoodauksen |
| 832×3456 sheet muistissa | Runtime käyttää vain yhtä sheetiä/hahmo; bake voi tuottaa `compact` |
| Invaders-tyylinen ASCII-bitmap ei skaalaudu LPC:hen | LPC = aina rasteri-sheet, ei ASCII |
| spritesheets/ koko (GB) | Submodule + bake CI:ssä; peliin vain valmiit PNG:t |

---

| Riski | Ratkaisu |
|-------|----------|
| GPL-koodi Ranger-binääriin | **Ok tarkoituksella** — merkitse `lpc/` GPLv3, jaa lähdekoodi |
| CC-BY-SA layer kaupallisessa pelissä | `licenseFilter` + dokumentoitu preset |
| PNG decode puuttuu Rangerista | `PNGDecoder.rgr` (Inflate.rgr on jo olemassa) |
| 832×3456 sheet muistissa | Runtime: `compact` / vain `walk`-strip; cache per selections-hash |
| Invaders-tyylinen ASCII-bitmap ei skaalaudu LPC:hen | LPC = aina rasteri-sheet, ei ASCII |
| spritesheets/ koko (GB) | Curated `lpc-pack.zip` per peli (`ZipReader.rgr`) |
| Ensimmäinen compose hidas Pi:llä | Layer-cache + progress UI + debounce |

---

## Ranger-native runtime compositor (pelaajakustomointi)

> **Tavoite:** pelaaja vaihtaa hiuksia/vaatteita pelissä → uusi spritesheet ilman
> uudelleenkääntöä, Nodea tai selainta. GPL-lisenssi hyväksytty.

### Miksi Ranger eikä vain bake?

| | Build-time bake | Ranger runtime compositor |
|--|-----------------|---------------------------|
| Pelaaja muuttaa ulkonäköä pelissä | ❌ vaatii uuden buildin | ✅ selections → compose |
| Modaus / save game -hahmo | ❌ | ✅ JSON selections tallennetaan |
| Pi offline (Koodisampo TV) | ❌ tarvitsee pre-bake jokaiselle variantille | ✅ yksi asset-pack, ääretön yhdistelmä |
| Kehityksen aloitus | helppo | vaikeampi (PNG decode) |
| Pelaaja kirjoittaa omaa logiikkaa | ❌ | ✅ `.game.tsx` + `lpcCompose()` API |

Bake säilyy **referenssinä ja testinä** (golden PNG parity), mutta pelaajille
merkityksellinen polku on Ranger.

### Pelaajakustomoinnin datavirta

```
┌─────────────────────────────────────────────────────────────────┐
│  Pelaajan valinnat                                               │
│  • in-game UI (hiukset, torso, väri…)                           │
│  • save slot: { bodyType, selections }                          │
│  • mod: lpc-pack.zip + oma selections.json                    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LpcCompositor (Ranger .rgr)                                     │
│  1. resolve paths (lpc_path.rgr)                                │
│  2. build drawCalls, sort zPos (lpc_draw.rgr)                   │
│  3. load PNG → ImageBuffer (lpc_png.rgr)                        │
│  4. palette recolor CPU (lpc_palette.rgr)                        │
│  5. alpha blit layerit (lpc_blit.rgr + RasterCompositor)        │
│  6. emit credits for used layers (lpc_credits.rgr)                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LpcSheetCache                                                   │
│  key = hash(bodyType + selections)                              │
│  value = ImageBuffer tai SoftCanvas (walk-only strip aluksi)      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
              GameRunner entity kind:"sheet" animoi frameja
```

### API pelaajille ja peliskripteille

```ranger
; Pelilogiikka / TSX-skripti voi kutsua hostin injektoimaa API:a:
def sheet:LpcSheet (lpcCompose bodyType selections "walk")
; sheet.width, sheet.height, sheet.frameW, sheet.getFrame(dir, index)
```

TSX-puolella (`game.d.ts`):

```typescript
interface LpcSelections {
  bodyType: string;
  selections: Record<string, { itemId: string; variant?: string; recolor?: string }>;
}

// Pelaajan tallennus — sama muoto kuin LPC character.json v2
function savePlayerLook(selections: LpcSelections): void;
function composePlayerSheet(selections: LpcSelections, anim?: string): SheetHandle;
```

Edistynyt modaaja voi editoida suoraan `selections`-objektia `.game.tsx`:ssä ilman
UI:ta — tämä on Ranger-pohjaisen pelin vahvuus verrattuna suljettuun Godot-pluginiin.

### Mitä portataan LPC:stä Rangeriin

| LPC (TypeScript) | Ranger-moduuli | Puhtaus | Huomio |
|------------------|----------------|---------|--------|
| `renderer.ts` drawCall-rakennus | `lpc_draw.rgr` | ~90 % puhdas logiikka | Ei DOM |
| `path.ts` | `lpc_path.rgr` | suora port | template-polut |
| `palettes.ts` + CPU recolor | `lpc_palette.rgr` | suora port | WebGL ei tarvita |
| `constants.ts` offsets | `lpc_anim.rgr` | vakiot | walk/slash/… |
| `catalog.ts` getters | `lpc_catalog.rgr` | **ei koko catalogia** | pre-baked JSON |
| `load-image.ts` | `lpc_png.rgr` | uusi | PNG decode |
| canvas `drawImage` | `lpc_blit.rgr` | uusi | alpha over |
| `credits.ts` | `lpc_credits.rgr` | suora port | pakollinen UI:ssa |

**Ei portata:** Mithril, WebGL recolor, zip-export UI, hash/URL UI.

### Tekniset esteet ja miten ratkaista

#### 1. PNG-dekoodaus (kriittisin aukko)

Nykytila: `ImageUtils` + `game_image_loader` tukevat **vain JPEG**. LPC-layerit
ovat **PNG** (alpha kanava pakollinen).

Ratkaisu: `PNGDecoder.rgr` gallery/pdf_writer -puolelle:
- PNG signature + IHDR + IDAT
- zlib inflate → **`Inflate.rgr` on jo olemassa** (ZIP:stä)
- filter types (None, Sub, Up, Average, Paeth)
- output → `ImageBuffer` RGBA

Vaihtoehto native-only: C-polyfill `stb_image` Pi-targetille — rikkoo
write-once-portabilityn, joten vältä ellei PNG pure Ranger liian hidas.

#### 2. Alpha blit

`RasterCompositor.blendSourceOver` (`RasterCompositing.rgr`) on valmis.
`SoftCanvas` tarvitsee sillan: `blitImageBuffer(src, sx, sy, sw, sh, dx, dy)`
tai compositor käyttää suoraan `RasterBuffer`-kangasta.

#### 3. Katalogin koko

LPC:n täysi metadata on megatavujen JS-moduuleja. Peliin ei mahdu kaikkea.

Ratkaisu — **curated asset pack** per peli:

```
assets/lpc-pack.zip          ; ZipReader.rgr avaa
  meta/items-lite.json       ; vain pelissä sallitut itemId:t
  meta/layers.json           ; zPos
  meta/palettes.json         ; recolor-mappaukset
  meta/credits-lite.json     ; attribuutiot packin itemeille
  spritesheets/...           ; vain tarvittavat PNG:t (esim. 200 MB, ei 2 GB)
```

`generate_sources.js` ajetaan **pelin buildissa** suodattimella:
`--include-type body,hair,torso,legs,feet,head`.

#### 4. Suorituskyky Pi:llä

Täysi universal sheet: ~50–150 drawCall × PNG load + recolor + blit.
Ensimmäinen compose voi kestää **sekunteja** ilman cachea.

Käytännön optimoinnit:

| Optimointi | Vaikutus |
|------------|----------|
| **Walk-only strip** (4×9 framea, ei 3456px) | ~10× vähemmän pikseliä |
| **Layer PNG cache** (itemId+variant+recolor → ImageBuffer) | toinen compose nopea |
| **Selections-hash → valmis sheet** | tallennettu hahmo instant |
| **Debounced preview** (300 ms) UI:ssa | ei compose joka näppäin |
| **Background compose** (ei game loopin sisällä) | ei jäädä 8 FPS:ään |

Invaders-opetus: älä piirrä compositoria joka frame — compose **kerran** kun
selections muuttuu, sitten vain animoi valmista sheetiä.

### GPL kun compositor on Rangerissa

Jos `lpc_*.rgr` on GPLv3 ja jaetaan pelin mukana:

| Kohde | Vaatimus |
|-------|----------|
| Compositor-lähdekoodi | GPLv3 — jaa repo / tarjoa lähdekoodi |
| Ranger compiler | erillinen — compositor on `.rgr`-lähde, ei compilerin johdannainen |
| Pelilogiikka (`.game.tsx`) | voi pysyä erillisenä jos **ei linkitetä** suljettuna — käytännössä sama prosessi → GPL-ketju todennäköinen koko pelipaketille |
| LPC **taide** PNG:t | **ei muutu** — CC-BY-SA/GPL attribuutio edelleen |
| Pelaajan generoima hahmo | credits-näyttö pakollinen käytetyille layereille |

**GPL ei korvaa taidelisenssiä.** Pelaaja voi valita CC-BY-SA-hiuksen → peli näyttää
edelleen creditsin. `licenseFilter` voi rajoittaa valintoja pelin profiilissa
(esim. vain CC0+OGA-BY lapsipelissä).

### In-game character creator (UI)

Kevyt versio ilman LPC:n koko puuta:

```
screen: "characterCreate"
  hud(): kategoria-välilehdet (body, hair, …)
  onButton: seuraava/edellinen variantti
  state.lpcSelections päivittyy
  event: "lpcCompose" → host kutsuu LpcCompositor
  preview: kind:"sheet" piirtää walk-frame 2 down
```

Täysi versio: TSX-komponentti joka lukee `lpc_catalog.rgr`:n kategoriat —
sama data kuin LPC UI, mutta Ranger JSX `hud()`.

### Toteutusjärjestys (Ranger-first)

| Vaihe | Moduuli | Tulos |
|-------|---------|-------|
| **R0** | `PNGDecoder.rgr` + testi | yksi LPC PNG → ImageBuffer |
| **R1** | `lpc_blit.rgr` | alpha blit ImageBuffer → RasterBuffer |
| **R1b** | `lpc_palette.rgr` | recolor yksi layer |
| **R2** | `lpc_draw.rgr` + `lpc_path.rgr` | drawCalls listaus |
| **R3** | `lpc_compose.rgr` | yksi tunnettu fixture-hahmo walk-strip |
| **R4** | `lpc_catalog.rgr` + zip pack | curated itemit |
| **R5** | GameRunner `kind:"sheet"` + demo UI | pelaaja vaihtaa hiusta |
| **R6** | credits-näyttö + save/load selections | laillinen + pysyvä hahmo |

Rinnalla: `lpc-bake` (Node) golden-testeihin — `compose_ranger()` === `compose_ts()`.

### Vertailu: mitä pelaaja oikeasti saa

```
Bake-polku:
  pelaaja valitsee → export PNG manuaalisesti → dev lisää assetin → uusi build

Ranger-polku:
  pelaaja valitsee → selections JSON → compose 1–3 s → pelaa heti
  tallenna → sama JSON seuraavalla kerralla → instant (cache)
  modaa → vaihda lpc-pack.zip → uudet vaatteet ilman koodimuutosta
```

---

## Suositus: mistä aloittaa

**Jos tavoite on pelaajakustomointi (GPL ok):**

1. **R0 PNGDecoder** — ilman tätä mitään muuta ei toimi
2. **R1–R3** compositor MVP yhdellä fixture-hahmolla (walk strip)
3. Golden parity TS-renderer vs Ranger (`lpc-bake` referenssinä)
4. **R4–R5** curated pack + demo character creator
5. Bake CLI jää dev/CI-työkaluksi, ei pelaajan polku

Tämä on [`ROADMAP.md`](./ROADMAP.md) tehtävä **1.6** kun R0 aloitetaan.

---

## Liitteet

- LPC renderer: `Universal-LPC-.../sources/canvas/renderer.ts`
- LPC export: `sources/state/json.ts` (`exportStateAsJSON`, version 2)
- Ranger sprite-protokolla: `scripting/game_sprite.rgr`, `scripting/game.d.ts`
- Ranger JPEG loader (PNG TODO): `scripting/game_image_loader.rgr`
- LPC attribuutio: `CREDITS.csv`, README § Licensing and Attribution
