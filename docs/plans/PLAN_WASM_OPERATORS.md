# WASM / LLVM: Lang-operaattorit (Array & Map)

T�m� dokumentti kuvaa, miten `Lang.rgr`:n array/map-operaattorit voidaan tuoda Low IR / WASM -backendiin. Nykyinen `IntList` / `IntMap` -demo k�ytt�� **luokkia + `Mem`-intrinskej�**; Lang-syntaksi (`def a:[int]`, `set`, `get`, �) on erillinen polku.

## Miksi Lang-templatet eiv�t riit�

`-l=llvm` k�ytt�� `RangerLLVMPipeline` ? `LowIRBuilderPass` ? LLVM/WAT. Se **ei** laajenna `Lang.rgr`:n `templates { es6 � }` -blokkeja kuten ES6-backend. `RangerLLVMClassWriter.writeClass` on tyhj� � koko moduuli rakennetaan Low IR:st�.

Joten jokainen operaattori pit�� joko:

1. **Laskea alasp�in** `ng_LowIRBuilder.rgr`:ss� (suositeltu), tai
2. Lis�t� `Lang.rgr`:iin `llvm`-template, **ja** rakentaa erillinen LLVM-template ? Low IR -silta (ei ole olemassa).

K�yt�nn�ss�: **lowering `ng_LowIRBuilder.rgr`:��n + pieni runtime (`RtArray` / `RtMap` tai `Mem`-laajennus)**.

## Nykytila (kes� 2026)

| Toiminto | Lang (`Lang.rgr`) | WASM Low IR |
|----------|-------------------|-------------|
| `def x:[int]` | `cmdDef` | ei |
| `def m:[int:int]` | `cmdDef` hash | ei |
| `make _:[int] n` | `cmdArrayLiteral` | ei |
| `([] _:[int] (�))` | `cmdArrayLiteral` | ei |
| `set a i v` | `cmdSet` array | ei |
| `get a i` | `cmdGet` array | ei |
| `set m k v` / `get m k` | `cmdSet` / `cmdGet` map | ei |
| `has m k` | `cmdHas` | ei |
| `array_length a` | `cmdArrayLength` | ei |
| `push a x` | `cmdPush` | ei |
| `keys m` | `keys` | ei (vaatii stringit) |
| Luokat `IntList` / `IntMap` | � | kyll� (`llvm_collections.rgr`) |
| `Mem.alloc/load/store` | � | kyll� (intrinsic) |

## Runtime-malli (yhteensopiva collections-demon kanssa)

Sama 12-tavun descriptor heapissa (kuten `IntList`):

```text
offset 0: data   (i32)  � osoite elementtidataan
offset 4: len    (i32)
offset 8: cap    (i32)
```

Map (`[int:int]`): kaksi bufferia + cap + size (kuten `IntMap`).

Handlet (`i32`) tallennetaan `lctx.slots` + uusi `collectionSlots:[string:string]` (`"array"` | `"map"`).

Intrinsiset (kuten `Mem_alloc`):

| Intrinsic | Vastaa Langia |
|-----------|----------------|
| `RtArray_newEmpty` | `def a:[int]` |
| `RtArray_newSized(n)` | `make _:[int] n` |
| `RtArray_get/set/len` | `get` / `set` / `array_length` |
| `RtMap_new` | `def m:[int:int]` |
| `RtMap_get/set/has` | `get` / `set` / `has` |

My�hemmin: `RtArray_push` ? Lang `push`.

## Toteutusvaiheet

### Vaihe 1 � `[int]` ja `[int:int]` (ei stringej�)

- `lowerVarDef`: tyhj� `def a:[int]` / `def m:[int:int]` (t�ll� hetkell� `valNode` puuttuu ? early return)
- `lowerExpr` / `lowerStmt`: operaattorit `get`, `set`, `array_length`, `has`, `make`
- Tunnista `nameNode.value_type` (`RangerNodeType.Array` / `Hash`) ja primitiivit `int`
- Fixture: `tests/fixtures/llvm_array_map_lang.rgr` (Lang-syntaksi, ei luokkia)
- WASM-testi + demo

**Ei viel�:** `optional` (`get` map), `null?` / `unwrap`, `push`, `keys`.

### Vaihe 2 � kasvu ja literaalit

- `push items x` ? `RtArray_push` (tai uudelleenallokointi)
- `([] _:[int] (1 2 3))` ? `make` + sarja `set`
- `itemAt` (jos macro erillisen�)

### Vaihe 3 � string-avaimet ja `keys`

- WASM-stringit (`[i8]` tai fixed buffer) tai int-avaimet demoissa
- `keys m` ? uusi `RtMap_keys` (palauttaa `[int]` avainlistana)

### Vaihe 4 � Lang.rgr `llvm`-rivit (valinnainen)

Dokumentointi / fallback vain jos halutaan jakaa logiikka Langin puolelle � ei korvaa Low IR -loweringia.

## Tunnetut esteet (ja miten kiert��)

| Este | Ratkaisu |
|------|----------|
| Tuplalauseet (`children` + `register_expressions`) | Korjaa parser/lowering; toistaiseksi v�lt� useita per�kk�isi� `push`-kutsuja |
| `while` + `if` WATissa | Map-probe rekursiolla (kuten `IntMap`) |
| `get` optional mapille | Vaihe 1: `int`-kartta, puuttuva = `-1` |
| `[string:T]` | Vaihe 3 |

## Testaus

```bash
npm run compile
npm run test:llvm
./scripts/compile-wasm.sh tests/fixtures/llvm_array_map_lang.rgr
```

## Liittyv�t tiedostot

- `compiler/ng_LowIRBuilder.rgr` � lowering
- `compiler/ng_LowIR.rgr` � `emit*` + intrinsiset
- `compiler/ng_WATWriter.rgr` / `ng_LLVMIRWriter.rgr`
- `tests/fixtures/llvm_collections.rgr` � luokkapohjainen referenssi
- `compiler/Lang.rgr` � operaattorim��rittelyt (rivit ~1111, 1881, 2939, 3442�4051)
