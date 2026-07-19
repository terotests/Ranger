# Fixtures

LPC `character.json` v2 -**data** testaamista varten. Nämä eivät ole compositor-koodia;
varsinaisen PNG-generoinnin tekee **Ranger** (`src/lpc_compose_runner.rgr`).

## Käyttö (tuleva)

Kun `lpc_draw.rgr` lukee selections JSON:n:

```bash
npm run engine:lpc:run -- --from fixtures/selections-minimal.json output/minimal.png
```

Toistaiseksi runner käyttää vain `bodyType`-shell-argia (`male` / `female` / `teen`).

## Attribuutio

Generoidut PNG:t vaativat credits-tiedoston (LPC `CREDITS.csv` / tuleva `lpc_credits.rgr`).

## Golden

```bash
npm run engine:lpc:run -- male gallery/game_engine/lpc/output/minimal.png
shasum -a 256 gallery/game_engine/lpc/output/minimal.png > fixtures/golden/minimal.sha256
```
