# WASM-backend � v�lidokumentaatio

T�m� dokumentti kuvaa Rangerin LLVM/WASM-pipelinen nykytilan (kes� 2026). Katso my�s [PLAN_WASM_PLUGINS.md](./PLAN_WASM_PLUGINS.md) pitk�n aikav�lin visiosta (pluginit ennen koodigenerointia).

## Pipeline

```text
Ranger .rgr
    ?  parse / analyze / typecheck
Low IR (ng_LowIR.rgr, ng_LowIRBuilder.rgr)
    ?  -l=llvm          ? LLVM IR (ng_LLVMIRWriter.rgr)
    ?  -l=llvm -wat     ? WAT text (ng_WATWriter.rgr)
    ?  wat2wasm         ? .wasm binary
Host (selain, Node, natiivi) kutsuu exportattuja funktioita
```

**Freestanding-malli:** ei I/O-runtimea. Staattiset `sfn`-metodit exportataan; host hoitaa `main`, sy�tteet ja tulosteen.

## Liput

| Lippu | Vaikutus |
|-------|----------|
| `-l=llvm` | Low IR ? LLVM IR teksti |
| `-wat` | Low IR ? WAT (tiedosto s�ilytt�� `.ll`-p��tteen toistaiseksi) |
| `-freestanding` | Exportaa kaikki kelvolliset staattiset metodit |

## Mit� Low IR tukee nyt

- Primitiivit: `int`, `bool`, `double` (WAT: vain i32 k�yt�nn�ss�)
- Staattiset metodit, rekursio, v�lilliset kutsut
- `if` / `while`, paikalliset muuttujat (`alloca` / `load` / `store`)
- `@(main)` ? LLVM `@main` (ei WAT-demossa pakollinen)

## WAT-backend (`ng_WATWriter.rgr`)

### Toimii

- Lineaariset funktiot (add, mul, ketjutetut kutsut)
- **`if` ilman else-haaraa** � strukturoitu `(if (then ...) )`, my�s kun then-haara `return`
- **`while`-silmukka** � `(block $exit (loop $cond ... br_if $exit ... br $cond))` + exit-koodi blockin j�lkeen
- Rekursiivinen fibonacci / factorial (`llvm_mathlib.rgr`)
- Iteratiivinen while-factorial (`llvm_factorial_while.rgr`)

### Rajoitukset

- Ei `if-else` molemmilla haaroilla (ei viel� tuettu strukturoituna)
- Ei stringej�, taulukoita, pointtereita
- Ei WASI / I/O
- Ei koko k��nt�j�n WASM-kohdetta (ks. alla)

### WASM-validointi

```bash
npm run demo:wasm              # compile + write tmp/wasm-demo/index.html
npm run demo:wasm:collections  # IntList/IntMap demo -> tmp/wasm-collections/
npm run demo:wasm:serve        # compile + http://127.0.0.1:8765/
```

Avaa `tmp/wasm-demo/index.html` suoraan selaimessa (WASM upotettu base64:n� � ei vaadi palvelinta). Vaihtoehtoisesti `demo:wasm:serve` k�ytt�� `fetch('./demo.wasm')`.

Vaatii `wabt` (`npm install`, devDependency).

## Natiivi-backend (vertailu)

```bash
npm run demo:native        # @main tai C-wrapper
./scripts/compile-native.sh tests/fixtures/llvm_main.rgr
```

## Fixturet

| Tiedosto | Kuvaus |
|----------|--------|
| `tests/fixtures/llvm_wasm_demo.rgr` | add/mul/sq/hypot � yksinkertainen WASM-demo |
| `tests/fixtures/llvm_mathlib.rgr` | fib + fact � haarat ja rekursio |
| `tests/fixtures/llvm_factorial_while.rgr` | while + assignment |
| `tests/fixtures/llvm_main.rgr` | `@main` natiividemo |
| `tests/fixtures/llvm_collections.rgr` | `IntList` + `IntMap` (heap, `Mem` intrinsics) |
| `tests/fixtures/llvm_list_smoke.rgr` | `IntList.push` / `get` smoke test |
| `tests/fixtures/llvm_array_map_lang.rgr` | Lang `def`/`set`/`get`/`make` (`[int]`, `[int:int]`) |

## Testit

```bash
npm run test:llvm
```

Sis�lt�� LLVM golden-testit, WAT-rakenteen tarkistukset ja `wat2wasm` + `WebAssembly.Instance` -ajon (fib, factorial, while).

## Koko k��nt�j� WASM:ksi?

**Ei realistinen lyhyell� aikav�lill�.**

| Este | Arvio |
|------|--------|
| Koodikoko | Parser + flow + writer = satoja tuhansia rivi� |
| Runtime | Hashmap, string, tiedostot, pluginit � ei Low IR:ss� |
| Nykyinen host | K��nt�j� ajetaan Node/JS:n� |
| WASM-koko | Arvio: kymmeni� MB + hidas k��nn�s |

Suositeltu j�rjestys: export-funktiot ? haarat WASM:ssa ? string/struct Low IR ? **erilliset** moduulit (parser lib) ? koko pipeline.

## Seuraavat askeleet

1. `if-else` strukturoitu WAT
2. `.wat` ulostiedoston nimi (ei `.ll`)
3. `wasm32` LLVM-polku (`clang --target=wasm32`) rinnalle
4. Low IR -plugin-rajapinta (PLAN_WASM_PLUGINS Phase 3)
5. ~~Lang array/map -operaattorit~~ (vaihe 1 valmis, ks. PLAN_WASM_OPERATORS.md)
6. `--target=wasm32-wasi` / `wasm32-hosted-debug` CLI


## Kaantajan kaantaminen LLVM:lle (elokuu 2026)

Aiempi arvio "ei realistinen lyhyella aikavalilla" koski koko kaantajan
ajamista WASM:ssa. Natiivi LLVM-polku sen sijaan yltaa nyt kauas:

- `npm run selfhost:compile:llvm` -> **0 virhetta** (aiemmin 631)
- `npm run selfhost:check:llvm` -> `opt -passes=verify` hyvaksyy 22 MB IR:n
- `npm run selfhost:build:llvm` -> `clang` linkittaa 3 MB `rangerc`-binaarin
- `npm run selfhost:round:llvm` -> **binaari kaantaa kaantajan**

Kaantaja **self-hostaa nyt LLVM:lla**. Natiivi binaari kaantaa
`compiler/ng_Compiler.rgr`:n, ja tulos on tavulleen sama kuin Node-buildin
tuottama. Tuo tulos on itsekin toimiva kaantaja: silla kaannetty kaantaja on
tavulleen sama kuin se itse, eli ketju on kiintopisteessa.

Yksityiskohdat ja jaljella olevat rajoitukset (sulkeumien kaappausten
kirjoitus takaisin, poikkeukset, pluginit): TARGET_NOTES.md, luku
"The compiler on LLVM: how far it gets".
