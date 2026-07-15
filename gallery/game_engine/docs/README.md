# Game engine — docs

Kehittäjädokumentaatio Ranger Game Enginelle. Yleiskuva ja pikaopas: [`../README.md`](../README.md);
nykytila ja roadmap: [`../ROADMAP.md`](../ROADMAP.md); ABI-tavoitespesifikaatio:
[`../IDEAL.md`](../IDEAL.md) + [`../IDEAL_API.md`](../IDEAL_API.md).

## Pelien kirjoittaminen (TSX)

| Dokumentti | Sisältö |
|------------|---------|
| [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) | TSX-skriptaus-API: `sprites`/`update`/`hud`, GameRunner, importit |
| [`GAME_ENGINE_DESIGN.md`](./GAME_ENGINE_DESIGN.md) | Retained-mode + JSX HUD -malli, suunnittelusäännöt |
| [`GAME_SCREENS_AND_STORAGE.md`](./GAME_SCREENS_AND_STORAGE.md) | Ruutujen lataus (`loadGame`/`pushGame`/`popGame`) ja `gamedata.json` |
| [`VOCAL_FX.md`](./VOCAL_FX.md) | Vokaaliefektit (`playVoice`) — enginen oma synteesi |

## Guest-polut (WASM / `.as`)

| Dokumentti | Sisältö |
|------------|---------|
| [`AS_SOURCE_ENGINE.md`](./AS_SOURCE_ENGINE.md) | `.as`-lähdekoodin tulkinta WASM-ABI:a vasten (kehitys ilman käännöstä) |
| [`AS_LANGUAGE_COVERAGE.md`](./AS_LANGUAGE_COVERAGE.md) | Tulkin kattama TS/AS-kielialijoukko `.as`/`.tsx`-peleille |

## Interpreter-sisäiset (ComponentEngine)

| Dokumentti | Sisältö |
|------------|---------|
| [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md) | Tunnetut evaluator-bugit ja korjaukset, avoimet rajoitukset |
| [`TS_ENGINE_OPTIMIZATION.md`](./TS_ENGINE_OPTIMIZATION.md) | Tulkin suorituskykytyö ja benchmarkit |

## Suunnittelu

| Dokumentti | Sisältö |
|------------|---------|
| [`PLAN_PHYSICS_RUNNER_GENERIC.md`](./PLAN_PHYSICS_RUNNER_GENERIC.md) | Geneerinen fysiikka-runner (`GameSceneProvider`), leak-guard — ks. [`../IDEAL.md`](../IDEAL.md) §3 |

> `scripting/AGENTS.md` jää `scripting/`-hakemistoon: se on kyseisen hakemiston
> lisäysohje agenteille, ei yleisdokumentti.
