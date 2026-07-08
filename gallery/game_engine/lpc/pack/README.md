# LPC asset packs (upotettu taide)

Compositor tarvitsee lähde-PNG:t jostain. **Koko LPC `spritesheets/` (~586 MB) ei kuulu
Ranger-repoon.** Sen sijaan käytetään kuratoituja paketteja tai ulkoista checkoutia.

## Kolme käyttömallia

| Malli | Milloin | Koko | Runtime-compose |
|-------|---------|------|-----------------|
| **Upotettu pack** (`pack/*/spritesheets/`) | Demo, CI, pieni peli | kB–MB | Kyllä (rajoitetut presetit) |
| **LPC_ROOT checkout** | Kehitys, täysi kustomointi | ~586 MB | Kyllä (kaikki itemit) |
| **Pre-bake** (`output/*.png`) | Julkaisu ilman compositoria | yksi PNG/sheet | Ei — vain valmis spritesheet |

## `demo-male-walk` (mukana repossa)

~28 KB, viisi walk-kerrosta male-presetille. Riittää:

```bash
npm run engine:lpc:run -- male gallery/game_engine/lpc/output/compose.png
```

kun `Universal-LPC-...` sibling-checkoutia **ei** ole. `build-lpc.sh` valitsee packin
automaattisesti fallbackina.

Attribuutio: `demo-male-walk/credits.json` (näytä pelissä / asetuksissa).

## Oma pack pelille

1. Valitse itemit (lisenssisuodatus: vältä GPL jos et halua johdannaisehtoja).
2. Kopioi vain tarvittavat `spritesheets/.../walk.png` (tai muut animaatiot).
3. Lisää `pack.json` + `credits.json`.
4. Aja compose: `LPC_ROOT=gallery/game_engine/lpc/pack/my-game npm run engine:lpc:run`

Tulevaisuudessa: `lpc_pack_builder.rgr` + `ZipReader.rgr` → `assets/lpc-pack.zip`.

## Päivitä demo-pack täydestä LPC:stä

```bash
./gallery/game_engine/scripts/sync-lpc-pack-demo.sh
```
