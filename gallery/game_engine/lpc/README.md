# LPC Spritesheet Compositor (Ranger)

**Ranger-käännös** — compositor on `.rgr`-lähdekoodia, joka käännetään `rgrc`:llä /
`bin/output.js`:llä. Ei JavaScript-compositoria eikä npm-riippuvuuksia tässä
hakemistossa.

LPC:n **taide** ei ole automaattisesti mukana — compositor lukee `spritesheets/`-puita
jostain. Kolme käytännön mallia:

| Lähde | Koko | Käyttö |
|-------|------|--------|
| **`pack/demo-male-walk/`** (mukana repossa) | ~28 KB | Demo / CI, male walk |
| **`LPC_ROOT`** (Universal-LPC checkout) | ~586 MB | Täysi kustomointi kehityksessä |
| **Pre-bake** (`output/*.png`) | 1 sheet | Peli ilman runtime-compositoria |

Oletus: `build-lpc.sh` käyttää sibling-LPC:tä jos löytyy, muuten upotettua packia.
Katso [`pack/README.md`](./pack/README.md).

## Rakenne

```
lpc/
  README.md
  TODO.md
  lpc.config.json          — oletuspolku (dokumentaatio; CLI käyttää LPC_ROOT)
  fixtures/                — selections JSON (data, ei koodia)
  pack/                    — upotetut LPC-assetit (demo-male-walk ~28 KB)
  output/                  — generoidut PNG:t
  src/
    lpc_compose_runner.rgr — CLI-entry (käännetään + ajetaan Nodella)
    lpc_compose.rgr        — compositor
    lpc_config.rgr         — LPC_ROOT / spritesheets-polku
    png_decoder.rgr        — PNG → ImageBuffer (indexed 4/8-bit + RGBA)
    lpc_blit.rgr, lpc_palette.rgr, …
```

Build-skriptit (bash, kuten muu game engine): `gallery/game_engine/scripts/build-lpc.sh`

## Käyttö

```bash
# Ranger repo root
npm run engine:lpc:build
npm run engine:lpc:run
npm run engine:lpc:run -- female gallery/game_engine/lpc/output/female.png

# Useita bodyType-esimerkkejä
./gallery/game_engine/scripts/build-lpc-batch.sh

# Mukautettu LPC-polku (täysi repo tai oma pack)
LPC_ROOT=/path/to/Universal-LPC-Spritesheet-Character-Generator \
  npm run engine:lpc:run -- male gallery/game_engine/lpc/output/test.png

# Vain upotettu demo-pack (ilman sibling-checkoutia)
npm run engine:lpc:run -- male gallery/game_engine/lpc/output/test.png \
  gallery/game_engine/lpc/pack/demo-male-walk
```

Tuottaa **walk-strip** PNG:n (576×256, male demo). Tunnettuja bugeja ja hitaus
jää myöhempään työhön — katso `TODO.md`.

## Lisenssi

- Ranger `lpc/src/*.rgr`: GPLv3 (yhteensopiva LPC-generaattorin kanssa).
- LPC `spritesheets/`: CC0 / CC-BY / CC-BY-SA / OGA-BY / GPL per tiedosto — `CREDITS.csv`.

## Dokumentaatio

- [`TODO.md`](./TODO.md) — työvaiheet
- [`../LPC_HEADLESS_SPRITESHEET.md`](../LPC_HEADLESS_SPRITESHEET.md) — arkkitehtuuri
