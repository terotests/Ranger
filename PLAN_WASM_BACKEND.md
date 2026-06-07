# WASM-backend ù vùlidokumentaatio

Tùmù dokumentti kuvaa Rangerin LLVM/WASM-pipelinen nykytilan (kesù 2026). Katso myùs [PLAN_WASM_PLUGINS.md](./PLAN_WASM_PLUGINS.md) pitkùn aikavùlin visiosta (pluginit ennen koodigenerointia).

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

**Freestanding-malli:** ei I/O-runtimea. Staattiset `sfn`-metodit exportataan; host hoitaa `main`, syùtteet ja tulosteen.

## Liput

| Lippu | Vaikutus |
|-------|----------|
| `-l=llvm` | Low IR ? LLVM IR teksti |
| `-wat` | Low IR ? WAT (tiedosto sùilyttùù `.ll`-pùùtteen toistaiseksi) |
| `-freestanding` | Exportaa kaikki kelvolliset staattiset metodit |

## Mitù Low IR tukee nyt

- Primitiivit: `int`, `bool`, `double` (WAT: vain i32 kùytùnnùssù)
- Staattiset metodit, rekursio, vùlilliset kutsut
- `if` / `while`, paikalliset muuttujat (`alloca` / `load` / `store`)
- `@(main)` ? LLVM `@main` (ei WAT-demossa pakollinen)

## WAT-backend (`ng_WATWriter.rgr`)

### Toimii

- Lineaariset funktiot (add, mul, ketjutetut kutsut)
- **`if` ilman else-haaraa** ù strukturoitu `(if (then ...) )`, myùs kun then-haara `return`
- **`while`-silmukka** ù `(block $exit (loop $cond ... br_if $exit ... br $cond))` + exit-koodi blockin jùlkeen
- Rekursiivinen fibonacci / factorial (`llvm_mathlib.rgr`)
- Iteratiivinen while-factorial (`llvm_factorial_while.rgr`)

### Rajoitukset

- Ei `if-else` molemmilla haaroilla (ei vielù tuettu strukturoituna)
- Ei stringejù, taulukoita, pointtereita
- Ei WASI / I/O
- Ei koko kùùntùjùn WASM-kohdetta (ks. alla)

### WASM-validointi

```bash
npm run demo:wasm              # compile + write tmp/wasm-demo/index.html
npm run demo:wasm:collections  # IntList/IntMap demo -> tmp/wasm-collections/
npm run demo:wasm:serve        # compile + http://127.0.0.1:8765/
```

Avaa `tmp/wasm-demo/index.html` suoraan selaimessa (WASM upotettu base64:nù ù ei vaadi palvelinta). Vaihtoehtoisesti `demo:wasm:serve` kùyttùù `fetch('./demo.wasm')`.

Vaatii `wabt` (`npm install`, devDependency).

## Natiivi-backend (vertailu)

```bash
npm run demo:native        # @main tai C-wrapper
./scripts/compile-native.sh tests/fixtures/llvm_main.rgr
```

## Fixturet

| Tiedosto | Kuvaus |
|----------|--------|
| `tests/fixtures/llvm_wasm_demo.rgr` | add/mul/sq/hypot ù yksinkertainen WASM-demo |
| `tests/fixtures/llvm_mathlib.rgr` | fib + fact ù haarat ja rekursio |
| `tests/fixtures/llvm_factorial_while.rgr` | while + assignment |
| `tests/fixtures/llvm_main.rgr` | `@main` natiividemo |
| `tests/fixtures/llvm_collections.rgr` | `IntList` + `IntMap` (heap, `Mem` intrinsics) |
| `tests/fixtures/llvm_list_smoke.rgr` | `IntList.push` / `get` smoke test |
| `tests/fixtures/llvm_array_map_lang.rgr` | Lang `def`/`set`/`get`/`make` (`[int]`, `[int:int]`) |

## Testit

```bash
npm run test:llvm
```

Sisùltùù LLVM golden-testit, WAT-rakenteen tarkistukset ja `wat2wasm` + `WebAssembly.Instance` -ajon (fib, factorial, while).

## Koko kùùntùjù WASM:ksi?

**Ei realistinen lyhyellù aikavùlillù.**

| Este | Arvio |
|------|--------|
| Koodikoko | Parser + flow + writer = satoja tuhansia riviù |
| Runtime | Hashmap, string, tiedostot, pluginit ù ei Low IR:ssù |
| Nykyinen host | Kùùntùjù ajetaan Node/JS:nù |
| WASM-koko | Arvio: kymmeniù MB + hidas kùùnnùs |

Suositeltu jùrjestys: export-funktiot ? haarat WASM:ssa ? string/struct Low IR ? **erilliset** moduulit (parser lib) ? koko pipeline.

## Seuraavat askeleet

1. `if-else` strukturoitu WAT
2. `.wat` ulostiedoston nimi (ei `.ll`)
3. `wasm32` LLVM-polku (`clang --target=wasm32`) rinnalle
4. Low IR -plugin-rajapinta (PLAN_WASM_PLUGINS Phase 3)
5. ~~Lang array/map -operaattorit~~ (vaihe 1 valmis, ks. PLAN_WASM_OPERATORS.md)
6. `--target=wasm32-wasi` / `wasm32-hosted-debug` CLI
