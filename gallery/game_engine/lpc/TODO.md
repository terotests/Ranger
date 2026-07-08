# LPC Compositor — työvaiheet

> Päivitetty: heinäkuu 2026  
> **Kaikki compositor-logiikka on Ranger `.rgr` -lähdekoodia** — ei JS/TS-kopiota `lpc/`-kansioon.
> LPC-repo tarjoaa vain `spritesheets/` + metadata (ulkoinen `LPC_ROOT`).

Merkitse valmiit kohdat `[x]`. Pidä tämä tiedosto ajan tasalla kun vaihe etenee.

---

## Vaihe 0 — Perustaminen

- [x] Hakemisto `gallery/game_engine/lpc/`
- [x] Ranger-moduulit `src/*.rgr` (luonnos)
- [x] `lpc_compose_runner.rgr` + `gallery/game_engine/scripts/build-lpc.sh`
- [x] `fixtures/*.json` (selections-data, ei koodia)
- [x] Poistettu Node-compositor (`headless-compose.ts`, `package.json` lpc:stä)
- [x] `npm run engine:lpc:build` kääntää ilman virheitä ✅

---

## Vaihe 1 — PNG-generointi (Ranger standalone)

### 1a — Build & CLI

- [x] `src/lpc_compose_runner.rgr` — shell_arg bodyType, output, lpcRoot
- [x] `src/lpc_config.rgr` — LPC_ROOT, spritesheetsDir
- [x] `scripts/build-lpc.sh` + `build-lpc-batch.sh` (Ranger repo scripts/)
- [x] `npm run engine:lpc:build` / `engine:lpc:run` (package.json)
- [x] Ensimmäinen oikea PNG (male walk demo: body+pants+boots+head+hair)

### 1b — PNG-dekoodaus (R0)

- [x] `src/png_decoder.rgr` — indexed (4/8-bit) + RGBA, zlib inflate, PNG filters
- [x] Testi: LPC walk-layer PNG:t (5 kerrosta)

### 1c — Blit + palette (R1)

- [x] `src/lpc_blit.rgr`, `src/lpc_palette.rgr` — alpha blit toimii
- [x] `rgba_fast_blit.rgr` + `src/lpc_layer_cache.rgr` — buffer-tason blit, singleton layer-cache
- [ ] Täysi palettivaihto (porttaus LPC-algoritmista Rangeriin, ei TS-kopiota)
- [x] Viisi layeria oikeassa z-järjestyksessä (`lpc_demo_male.rgr`)

### 1d — Compose MVP (R2–R3)

- [x] `src/lpc_anim.rgr`, `lpc_path.rgr`, `lpc_draw.rgr`, `lpc_compose.rgr`
- [x] `lpc_demo_male.rgr` — hardcoded male walk preset
- [x] Walk-strip PNG ulos `PNGEncoder`:llä (576×256, 9 framea/rivi)
- [ ] `lpc_draw.rgr` — selections + catalog → drawCalls (JSON fixtures)
- [ ] Golden RGBA/PNG `fixtures/golden/`

### 1e — Credits + fixtures

- [x] `src/lpc_credits.rgr` — luonnos
- [ ] Credits JSON/text rinnalle `output/*-credits.json`
- [ ] `licenseFilter` kaupalliseen preset:iin

---

## Vaihe 2 — Curated asset pack (Ranger)

- [x] `src/lpc_pack_builder.rgr` — luonnos
- [x] `src/lpc_catalog.rgr` — ZipReader-luonnos
- [ ] Toteuta pack: meta JSON + suodatetut PNG:t → zip
- [ ] Compose ilman koko LPC-kloonin läsnäoloa

---

## Vaihe 3 — Game engine (dynaaminen hahmoluonti)

- [ ] `kind: "sheet"` GameRunnerissa
- [ ] `LpcSheetCache` + `lpcCompose()` host-API
- [ ] `scripting/lpc_character_demo.game.tsx`

---

## Vaihe 4 — Pelaajakustomointi UI

- [ ] Character creator -näyttö
- [ ] Save/load selections
- [ ] Credits pelissä

---

## Käännös ja ajo (muistilista)

```bash
cd /path/to/Ranger
npm run engine:lpc:build
npm run engine:lpc:run -- male gallery/game_engine/lpc/output/compose.png
```

Lähdetiedosto: `gallery/game_engine/lpc/src/lpc_compose_runner.rgr`  
Käännös: `tmp/lpc/lpc_compose_runner.js` (ei versionhallintaan)
