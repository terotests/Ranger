# Selainpelit github.io:lla — suunnitelma

> **Päivitetty:** heinäkuu 2026  
> **Tarkoitus:** mahdollistaa pelien kokeilu suoraan selaimessa (GitHub Pages),  
> mieluiten **liittämällä TSX-lähdekoodi** editoriin ja painamalla Run.  
> **Liittyvät dokumentit:** [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md),  
> [`RENDERING_EVG.md`](./RENDERING_EVG.md), [`ROADMAP.md`](./ROADMAP.md) (vaihe 4.5),  
> [`playground/README.md`](../../playground/README.md)

---

## 1. Tavoite ja käyttötarina

**Mitä halutaan:**

1. Avaa `https://terotests.github.io/Ranger/` (tai erillinen `/games/`-polku).
2. Liitä tai kirjoita pelin `index.tsx` (tai `pong.game.tsx`-tyylinen skripti).
3. Paina **Run** → peli käynnistyy `<canvas>`-elementissä.
4. Näppäimistö (ja myöhemmin gamepad) toimii ilman asennusta.
5. Ääni on **nice-to-have** alussa, ei estä ensimmäistä versiota.

**Mitä EI haluta (ainakaan ensimmäisessä vaiheessa):**

- Koko SDL2/OpenGL-pinoa Emscriptenillä selaimen sisään — repossa ei ole Emscripten-tukea, eikä se ole oikea abstraktio.
- Pelilogiikan uudelleenkirjoitusta — sama TSX ja `GameRunner`-API kuin SDL-polulla.
- WASM-kääntäjän bundlaamista selaimen runtimeksi — liian iso ja rajoitettu (`PLAN_WASM_BACKEND.md`).

**Ydinajatus:** Ranger-kääntäjä ja TS-parseri ajetaan selaimessa **JavaScriptinä** (kuten nykyinen playground). Pelilogiikka on TSX, jota `ComponentEngine` tulkitsee runtime-aikana. Piirtokerros tuottaa **RGBA8888-bufferin** (`SoftCanvas`), ja uusi **web-platform-backend** esittää sen canvasilla tai WebGL:llä.

---

## 2. Nykytila — mitä on jo valmiina

### 2.1 Arkkitehtuurinen jako (toimii jo)

```
┌─────────────────────────────────────────────────────────────┐
│  Platform-backend  ← TÄSSÄ PUUTTUU WEB-VERSIO              │
│  game_sdl_runner.rgr  (SDL2 + OpenGL/GLES2)                  │
│  pong.rgr             (terminaali)                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ input-maskit, timing, present
┌───────────────────────────▼─────────────────────────────────┐
│  GameRunner + ComponentEngine  (portable, ES6-käännettävissä) │
│  TSX: initState / update / sprites / hud                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ tila
┌───────────────────────────▼─────────────────────────────────┐
│  Piirtokerros — portable                                       │
│  game_sprite.rgr, game_hud.rgr, game_particles.rgr            │
└───────────────────────────┬─────────────────────────────────┘
                            │ RGBA8888
┌───────────────────────────▼─────────────────────────────────┐
│  framebuffer.rgr — SoftCanvas                                  │
└───────────────────────────────────────────────────────────────┘
```

**Kova raja** (dokumentoitu `README.md`:ssä): jos tiedosto kutsuu `gfx_present`, `poll_keypress` tms., se on backend. Kaikki muu on portable.

### 2.2 Mitä webissä on jo

| Osa | Tila | Polku |
|-----|------|-------|
| Ranger-kääntäjä selaimessa | ✅ | `playground/`, `VirtualCompiler.rgr` |
| GitHub Pages -deploy | ✅ | `.github/workflows/deploy-playground.yml` |
| Headless GameRunner (Node) | ✅ | `pong_runner_demo.rgr` |
| SoftCanvas RGBA8888 | ✅ | `framebuffer.rgr` |
| TSX-tulkinta | ✅ | `ComponentEngine.rgr` + `ts_parser/` |
| SDL/OpenGL present | ✅ natiivi | `gfx_sdl.rgr` |
| Web present | ❌ | `gfx_sdl.rgr` es6-templateit ovat stub (`undefined` / `0`) |
| Web input | ❌ | `game_input.rgr` riippuu `gfx_sdl`-maskeista |
| Web audio | ❌ | `game_audio_sdl.rgr` → SDL, ei Web Audio |
| Peli-playground UI | ❌ | Vain compiler-playground |

### 2.3 Porttausongelmat (SDL / OpenGL → selain)

| Natiivi (gfx_sdl) | Selainvastine | Huomio |
|-------------------|---------------|--------|
| `SDL_CreateWindow` | `<canvas>` + `requestAnimationFrame` | Ei ikkunaa, vaan DOM-elementti |
| `SDL_UpdateTexture` / GL texture upload | `putImageData` tai `texImage2D` | Sama RGBA8888-data `SoftCanvas.raw()`:sta |
| OpenGL 2.1 / GLES2 fixed pipeline | WebGL 1/2 + yksinkertainen shader | Ei GL-fixed-funktioita; tarvitaan minishader |
| `SDL_PollEvent` (keyboard) | `keydown`/`keyup` + `event.preventDefault` | Key-up tuettu (parempi kuin terminaali) |
| `SDL_GameController` | Gamepad API (`navigator.getGamepads()`) | Sama `InputMask`-bitti-layout |
| `SDL_OpenAudioDevice` | `AudioContext` + `AudioBufferSourceNode` | Async init (käyttäjäklikki) |
| `gfx_ticks_ms()` | `performance.now()` | Delta-time laskenta |
| Tiedostojärjestelmä (`buffer_read_file`) | Paste / fetch / virtual FS | Paste-polussa ei tiedostoja |

**Johtopäätös:** Emscripten-SDL ei ole oikea suunta. Sen sijaan toteutetaan **rinnakkainen operator-perhe** (`gfx_web.rgr`), joka toteuttaa saman **sopimuksen** kuin `gfx_sdl.rgr`, mutta es6-templateilla jotka kutsuvat DOM/WebGL/Web Audio -koodia.

---

## 3. Abstraktiotaso — Platform Backend -sopimus

### 3.1 Operator-rajapinta (yhteinen SDL ↔ Web)

Nykyinen `gfx_sdl.rgr` määrittelee jo operator-perheen. Web-backend täyttää saman sopimuksen:

```
; Lifecycle
gfx_open(title, w, h)           → int     ; luo canvas / GL-konteksti
gfx_close()                     → void
gfx_should_close()              → bool

; Present (tärkein)
gfx_present(pixels:buffer, w, h) → void   ; RGBA8888 → ruutu
gfx_present_split(...)          → void   ; split-screen (myöhemmin)

; Input (bittimaski per lähde, ks. InputMask)
gfx_input_source_mask(source)   → int
gfx_poll_events()               → void   ; tyhjentää event-jonon DOM:sta

; Timing
gfx_ticks_ms()                  → int

; Audio (nice-to-have)
gfx_audio_open(freq, channels)  → int
gfx_audio_queue(samples:buffer) → void
gfx_audio_clear()               → void

; Gamepad (nice-to-have)
gfx_rumble_pad(pad, low, high, ms) → void  ; selaimessa no-op tai Vibration API
```

**Toteutusstrategia:**

1. **`gfx_web.rgr`** — uusi tiedosto, vain `es6`-templateit (vastine `gfx_sdl.rgr`:n `cpp`-templateille).
2. **`game_web_runner.rgr`** — vastine `game_sdl_runner.rgr`:lle; importtaa `gfx_web.rgr` eikä `gfx_sdl.rgr`.
3. **`game_input.rgr`** — pysyy ennallaan; se lukee maskeja abstraktista lähteestä. Vaihtoehto: siirrä `Import "../gfx_sdl.rgr"` → `Import "../gfx_platform.rgr"` joka re-exporttaa oikean backendin build-aikana (tai käytä erillisiä host-tiedostoja kuten nyt SDL vs terminal).

### 3.2 Present-polku — kaksi vaihetta

#### Vaihe A: Canvas 2D (`putImageData`) — MVP

```javascript
// gfx_web es6-template (konsepti)
function rgfx_present(pixels, w, h) {
  const clamped = new Uint8ClampedArray(pixels.buffer || pixels);
  ctx.putImageData(new ImageData(clamped, w, h), 0, 0);
}
```

- **Plussat:** yksinkertainen, ei shadereita, toimii kaikissa selaimissa, golden-frame -testit pysyvät identtisinä.
- **Miinukset:** täysi ruudun kopiointi joka frame (~480×270×4 ≈ 0,5 MB); riittää PoC:lle ja kevyille peleille.

#### Vaihe B: WebGL texture upload — suorituskyky

Peilaa natiivin `gfx_open_gpu` / `rgfx_gpu_present` -polkua:

```
SoftCanvas.raw()  →  Uint8Array RGBA
                  →  gl.texImage2D(GL_TEXTURE_2D, ..., GL_RGBA, ...)
                  →  fullscreen quad (GLSL)
                  →  canvas
```

- Sama dataformaatti kuin SDL OpenGL-polulla (`RENDERING_EVG.md` §3, §6).
- Mahdollistaa myöhemmin GPU-partikkelit (`GameRuntimeOptions.particlesGpuOverlay`).
- WebGL 1 riittää (GLES2-yhteensopiva).

### 3.3 Input-abstraktio

`game_input.rgr` tuottaa `props.input.players[]` — `PlayerButtons`-objekteja. Web-host:

| Lähde (`gfx_input_source_mask`) | Selain |
|---------------------------------|--------|
| `RGFX_SRC_KB_P1` (0) | WASD, Space, Q |
| `RGFX_SRC_KB_P2` (1) | Nuolinäppäimet |
| `RGFX_SRC_PAD0..7` | `gamepads[i]` Gamepad API:sta |

DOM-tapahtumat kerätään `gfx_poll_events()`-kutsussa; `requestAnimationFrame`-loop kutsuu sitä ennen `runner.frame()`.

### 3.4 Ääni-abstraktio (nice-to-have)

Nykyinen ketju:

```
game_audio.rgr (PCM-synteesi) → GameHost events → game_audio_sdl.rgr → gfx_audio_queue
```

Web-ketju:

```
game_audio.rgr → game_audio_web.rgr → gfx_web audio operators → AudioContext
```

- `game_audio.rgr` pysyy portable — se tuottaa PCM-sampleja.
- `AudioContext` vaatii käyttäjäinteraktion (klikki "Run") ennen `resume()`.
- Sama `playSound("blip")` -event-malli kuin SDL-polulla.

---

## 4. Kokonaisarkkitehtuuri — paste-to-play

```
┌──────────────────────────────────────────────────────────────────┐
│  game-playground/  (uusi Vite-app tai playground-laajennus)       │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐   │
│  │ TSX editor  │  │ <canvas id="game">                        │   │
│  │ (Monaco)    │  │ requestAnimationFrame → game loop         │   │
│  └─────────────┘  └──────────────────────────────────────────┘   │
│  [Run] [Stop] [Esimerkit ▼]                                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │ bundlattu ES6
┌────────────────────────────▼─────────────────────────────────────┐
│  game_web_runner.rgr  →  output.js (pre-built, ei käyttäjän koodi)│
│    GameRunner + ComponentEngine + ts_parser + SoftCanvas         │
│    + gfx_web.rgr (DOM glue)                                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │ loadScript(pasteSource)
┌────────────────────────────▼─────────────────────────────────────┐
│  Käyttäjän TSX (paste)                                            │
│    sprites() / initState() / update() / hud()                     │
└──────────────────────────────────────────────────────────────────┘
```

### 4.1 Miksi TSX-tulkinta, ei selaimessa-Ranger-käännös pelikoodille?

| Lähestymistapa | Plussat | Miinukset |
|----------------|---------|-----------|
| **ComponentEngine tulkitsee TSX** (suositus) | Nopea iterointi; sama kuin SDL hot-reload; ei compile-viivettä | Bundle iso; TS-osa rajoitettu |
| Käännä peli Ranger→JS selaimessa | Pienempi runtime | Hidas; vaatii koko kääntäjän + odotus; ei hot-reload |
| WASM pelilogiikalle | Nopea simulaatio | `PLAN_WASM_BACKEND`: ei stringejä/taulukoita; erillinen host |

**Suositus:** Pre-bundle `game_web_runner` + engine-riippuvuudet. Käyttäjän koodi on **pelkkä TSX-stringi**, joka annetaan `runner.loadScript(src)`.

### 4.2 Bundle-koko ja lataus

Arvioitu pre-built bundle (GameRunner + ComponentEngine + TSParser + EVG-palat):

- **5–15 MB** minifioitu (karkea arvio; mitattava ensimmäisessä POC:ssa).
- Strategiat:
  - Erillinen `/games/`-sivu, ei sama bundle kuin compiler-playground.
  - `esbuild` / Vite code-split: engine lazy-load Run-napista.
  - GitHub Pages CDN-cache.
  - Myöhemmin: vain tarvittavat moduulit (poista PDF/LLVM-palat bundlesta).

### 4.3 GitHub Pages -deploy

Laajenna nykyistä workflowta tai lisää rinnakkainen:

```yaml
# Konsepti
- build playground (olemassa)
- build game-playground:
    - npm run compile  # Ranger self-host
  - node bin/output.js -es6 gallery/game_engine/scripting/game_web_runner.rgr ...
  - vite build game-playground/
- deploy: playground/dist + game-playground/dist → Pages
```

Polku: `https://terotests.github.io/Ranger/games/` tai erillinen repo.

---

## 5. Toteutusvaiheet

### Vaihe 0 — POC (MVP, ei ääntä)

**Tavoite:** Pong pyörii selaimessa paste-to-play -UI:ssa.

| # | Tehtävä | Tiedostot |
|---|---------|-----------|
| 0.1 | `gfx_web.rgr` — `gfx_open`, `gfx_present` (putImageData), `gfx_ticks_ms`, stub input | uusi |
| 0.2 | `game_web_runner.rgr` — rAF-loop, keyboard → maskit | uusi |
| 0.3 | Käännös-skripti: engine → yksi `game-engine-web.js` bundle | `scripts/build-game-web.sh` |
| 0.4 | Minimal UI: textarea + Run + canvas | `game-playground/` tai `playground/games-tab` |
| 0.5 | Vitest: headless `game_web_runner` Node-shimillä (kuten `pong_runner_demo`) | `tests/` |
| 0.6 | Deploy GitHub Pagesiin | workflow |

**Onnistumiskriteeri:** `pong.game.tsx` paste → pallo liikkuu, score näkyy, Q quit.

### Vaihe 1 — Input ja pelikatalogi

| # | Tehtävä |
|---|---------|
| 1.1 | Täysi keyboard-mapping (P1/P2, kaikki InputMask-bitit) |
| 1.2 | Gamepad API -tuki |
| 1.3 | Esimerkkivalikko (Pong, Breakout, …) — fetch valmiit `games/*/index.tsx` |
| 1.4 | `dt` oikeasta frameratesta (`performance.now()`) |

### Vaihe 2 — WebGL present

| # | Tehtävä |
|---|---------|
| 2.1 | `gfx_open_gpu` / `gfx_present_gpu` web-versiot |
| 2.2 | Yksinkertainen RGBA-texture shader |
| 2.3 | Valinnainen `--webgl` / automaattinen fallback Canvas 2D:hen |

### Vaihe 3 — Ääni (nice-to-have)

| # | Tehtävä |
|---|---------|
| 3.1 | `game_audio_web.rgr` + `gfx_audio_*` web-templateit |
| 3.2 | AudioContext resume Run-napista |
| 3.3 | `playSound` / `playMusic` eventit toimivat |

### Vaihe 4 — Kehittäjäkokemus

| # | Tehtävä |
|---|---------|
| 4.1 | Monaco-editor + `game.d.ts` tyypitys |
| 4.2 | Virheilmoitukset TSX-parse-virheistä selkeästi UI:ssa |
| 4.3 | Jaettava linkki (URL hash + lz-string pakattu lähde) |
| 4.4 | Hot-reload editorista (AST-patch, kuten SDL `--hot-reload`) |

### Vaihe 5 — Suorituskyky (valinnainen)

| # | Tehtävä |
|---|---------|
| 5.1 | WASM-vienti vain `SoftCanvas.fillRect`-hotspot (freestanding) |
| 5.2 | Dirty rectangles presentissä |
| 5.3 | OffscreenCanvas + Worker (piirtäminen taustasäikeessä) |

---

## 6. Mitä EI portata / mitä välttää

1. **Emscripten + SDL2** — ylläpito, bundle-koko, ei vastaa Rangerin operator-mallia.
2. **Koko OpenGL-shaderipino sellaisenaan** — WebGL vaatii GLSL 1.00/3.00; kirjoita minishader erikseen.
3. **Tiedostojärjestelmä** — paste-polussa ei `import` tiedostoista (paitsi pre-injectatut helperit). Ratkaisu: inline paste tai yhden tiedoston pelit aluksi.
4. **LLVM/WASM koko moottorille** — epärealistinen lyhyellä aikavälillä.
5. **EVG täysi natiivi rasterointi selaimessa** — toimii jo ES6:na; ei tarvitse erillistä porttausta.

---

## 7. Testausstrategia

| Taso | Miten |
|------|-------|
| **Unit** | `SoftCanvas`, `game_input` mask-mapping (olemassa) |
| **Headless runner** | `game_web_runner` N framella, assert ball position (kuten `pong_runner_demo`) |
| **Render golden** | `runner.raw()` vs tallennettu `.rgba` (olemassa `game-engine-render.test.ts`) |
| **Selain** | Playwright: avaa playground, paste, odota canvas pixel |
| **SDL-parity** | Sama TSX, sama input-sekvenssi → sama lopputila (Node SDL vs web headless) |

---

## 8. Avoimet kysymykset

1. **Erillinen sivu vs playground-laajennus?**  
   Suositus: erillinen `game-playground/` — pienempi ensimmäinen lataus compiler-käyttäjille.

2. **`import`-lauseet TSX:ssä?**  
   Aluksi: ei tueta (yksi tiedosto). Myöhemmin: virtual module resolver paste-ympäristössä.

3. **Monaco-lisenssi / bundle**  
   Kevyt vaihtoehto: `<textarea>` POC:ssa, Monaco vaiheessa 4.

4. **CORS / assetit**  
   `resources()` kuvat: base64 inline tai samasta GitHub Pages -originista.

5. **Mobiili**  
   Kosketusnäyttö → virtuaalinen D-pad myöhemmin; ei MVP:ssä.

---

## 9. Yhteenveto

| Kerros | Toimenpide |
|--------|------------|
| **Pelilogiikka / TSX** | Ei muutoksia — sama `GameRunner`-API |
| **Piirtö** | Ei muutoksia — `SoftCanvas` + sprite/HUD |
| **Platform** | **Uusi** `gfx_web.rgr` + `game_web_runner.rgr` |
| **Present** | MVP: `putImageData` → myöhemmin WebGL |
| **Input** | DOM keyboard + Gamepad API → sama `InputMask` |
| **Ääni** | Web Audio sink (vaihe 3) |
| **UI / deploy** | `game-playground` + GitHub Pages |
| **Paste-to-play** | `loadScript(editorValue)` — ei Ranger-käännöstä pelikoodeille |

Rangerin vahvuus on jo olemassa oleva **RGBA-bufferi + host** - jako. Selainversio ei porttaa SDL:ää vaan täyttää saman operator-sopimuksen JavaScriptillä. Tämä on linjassa `PLAN_GAME_ENGINE.md`:n kanssa (Canvas web -backend suunniteltu) ja `ROADMAP.md` vaiheen 4.5 kanssa.

**Seuraava askel toteutuksessa:** Vaihe 0.1–0.4 — `gfx_web.rgr`, `game_web_runner.rgr`, minimal UI, ensimmäinen GitHub Pages -deploy.
