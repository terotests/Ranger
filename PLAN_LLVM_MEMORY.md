# Ranger LLVM – muistinhallintasuunnitelma

Tämä dokumentti kuvaa muistinhallintastrategian Rangerin LLVM-backendille. Katso myös [PLAN_STATIC_ANALYSIS.md](./PLAN_STATIC_ANALYSIS.md) olemassa olevaan staattisen analyysin infraan (C++/Rust).

## Toteutuksen eteneminen (2026-06-08)

**Vaihe 0 + Vaihe 1 + Vaihe 2 valmiit, Vaihe 3 aloitettu.** `npm run test:llvm` -> 35/35, koko sarja `npm test` -> 327 passed / 3 skipped (ei regressioita).

| Kohde | Tila |
|-------|------|
| `runtime/ranger_mem.c` – header + rc + RangerTypeDesc | valmis |
| `ranger_obj_new` / `ranger_obj_release` (libc-kohteet) | valmis |
| `RangerTypeDesc` / `RangerFieldDesc` globaali data LLVM IR:ssa | valmis |
| Generinen kenttädestruktio (string/object/ptr-array, owned-flag) | valmis |
| `lowerNewObject` -> `ranger_obj_new(size, @Class_typeDesc)` | valmis |
| Funktion lopun local-cleanup (`ownedObjectLocals`) | valmis |
| Return-escape: palautettu object local ei release | valmis |
| Loop-uudelleenmäärittely: release vanha ennen uutta `new` | valmis |
| Kenttäassign: release vanha arvo + retain/strdup uusi | valmis |
| Concat: strdup + `free` alkuperäinen bufferi | valmis |
| Ptr-array: owned-elementit, `ranger_ptrarray_release` | valmis |
| Push owned-lokaali = **move** (ei retainia, lokaali merkitään escaped) | valmis |
| `RangerMem` intrinsics testeissä | valmis |
| Testit: trivial, loop, string, field_assign, ptrarray, parser_sim | valmis |

**Push-semantiikka (päätös):** owned-lokaalin push arrayhin on **move** – array ottaa olemassa olevan referenssin, lokaalia ei vapauteta funktion lopussa. Tämä on oikein koska silmukan runko lowerataan kerran (per-iteraatio retain/release ei toimisi ilman per-iteraatio scope-cleanupia). Borrowed/ei-lokaali arvo pushataan edelleen `ranger_ptrarray_push_owned`-kutsulla (retain).

**Toteutetut tiedostot:** `runtime/ranger_mem.c`, `compiler/ng_LowIRBuilder.rgr`, `compiler/ng_LowIR.rgr`, `compiler/ng_LLVMIRWriter.rgr`, `compiler/ng_LowIRRuntime.rgr`, `tests/fixtures/llvm_mem_*.rgr`, `tests/compiler-llvm.test.ts`

**Seuraavaksi (Vaihe 3):** proper borrow-analyysi (promotoi todistetusti owned-kentät, poista borrow-by-default-vuodot); sitten `ts_parser_main` natiivi flat-muistiprofiili.

---

## Ydinperiaate

**Älä tee täyttä GC:tä.** Staattinen cleanup + kevyt RC + arena on Rangerille järkevämpi kuin tracing GC. Kolme kerrosta täydentävät toisiaan:

| Kerros | Rooli |
|--------|-------|
| **Staattinen cleanup** | Paikalliset lokaalit, concat-puskurit – suora `free` ilman rc:tä |
| **Kevyt RC** | Kentät, push, return – `retain`/`release` kun omistajuus ei ole triviaalinen |
| **Arena** | Parser/Lexer – tokenit, väliaikaiset AST-nodet, concat-bufferit |

---

## 1. Target-kohtainen ownership-tiukkuus (Vaihe 3:n ydinperiaate)

Eri käännöskohteilla on eri muistimallit. Kääntäjän **omistajuus- ja vapautuskäsittelyn tiukkuuden tulee skaalautua targetin mukaan.** Sama Ranger-lähde tuottaa eritasoiset tarkistukset riippuen siitä, onko targetilla jo muistinhallinta vai ei.

### 1.1 Targettien muistimalliluokat

| Luokka | Targetit | Kuka vapauttaa | Kääntäjän vastuu |
|--------|----------|----------------|------------------|
| **Manuaalinen** | LLVM + libc, C | Kääntäjän generoima RC/cleanup | **Tiukin** – jokainen owned-objekti pitää vapauttaa täsmälleen kerran |
| **Strict ownership** | Rust | Kielen oma borrow checker | **Tiukka** – omistajuus/borrow pitää olla yksiselitteinen, muuten kääntäjä hylkää |
| **Hallittu (GC/RC runtime)** | JS/TS, Go, Java, C#, Python, Swift (ARC) | Runtimen GC/ARC | **Löysin** – ei tarvita eksplisiittistä release/free |
| **Freestanding** | WASM bump-alloc, freestanding | Ei vapauteta (areena/bump) | **Erikois** – RC pois, arena hoitaa |

### 1.2 Periaate: ownership-tiukkuus on funktio targetista

```
ownershipStrictness(target) =
    Manuaalinen      -> EksaktiRC          (release-pakko, leak = bugi)
    StrictOwnership  -> BorrowTarkistus    (move/borrow yksiselitteinen)
    Hallittu         -> EiTarkistuksia     (runtime hoitaa)
    Freestanding     -> ArenaTaiBump       (ei per-objekti vapautusta)
```

Konkreettisesti tämä tarkoittaa, että **sama omistajuusanalyysi ajetaan aina, mutta sen tulosten *pakottavuus* ja *mihin koodiin se kääntyy* riippuu targetista:**

| Analyysitulos | Manuaalinen (LLVM/C) | Strict (Rust) | Hallittu (JS/GC) |
|---------------|----------------------|---------------|------------------|
| owned local, ei escape | `ranger_obj_release` scope-lopussa | drop (implisiittinen) | ei mitään |
| owned siirtyy (move/push) | move – ei release | `move` / ownership transfer | ei mitään |
| borrowed param | ei release | `&T` / `&mut T` | ei mitään |
| epäselvä omistajuus | **konservatiivinen retain/release** | **käännösvirhe / clone** | ei mitään |
| escape returnin kautta | ei release (caller omistaa) | palautettu omistajuus | ei mitään |

### 1.3 Miksi tämä on tärkeää nyt

- **LLVM/libc on tiukin asiakas.** Jos analyysi on epävarma omistajuudesta, manuaalisella targetilla *pitää* valita konservatiivinen retain/release (ennemmin ylimääräinen retain kuin vuoto/double-free). Tämä on jo nykytilan oletus.
- **Rust hyötyy samasta analyysistä mutta eri lopputuloksella.** `StaticAnalyzer` (`ng_StaticAnalysis.rgr`) tuottaa jo `rust_borrow_type` (0=owned, 1=borrow, 2=mut_borrow). Sama omistajuustieto pitäisi jakaa LLVM-polun kanssa.
- **Hallituilla targeteilla turha release on haitallista** – ei vain hyödytöntä vaan voi olla väärin (double-managed). Siksi `memEnabled` portittaa RC:n jo nyt `usesLibc`-lipulla.

### 1.4 Toteutuksen suunta

1. **Yhteinen omistajuusmalli** (`OwnershipKind`: `owned` / `borrowed` / `moved` / `static`) lasketaan kerran AST/flow-tasolla, riippumatta targetista.
2. **Target-adapteri** kääntää omistajuustuloksen target-spesifiksi koodiksi:
   - Manuaalinen: retain/release/free + cleanup-pisteet (nykyinen `ng_LowIRBuilder.rgr`-polku).
   - Rust: borrow-tyypit (nykyinen `StaticAnalyzer`).
   - Hallittu/freestanding: no-op / arena.
3. **Tiukkuuslippu** (`-strict-ownership` tms.) sallii LLVM-targetille varoituksen/virheen, jos owned-objektin elinkaarta ei voida todistaa (leak-riski). Hallituilla targeteilla lippu on no-op.

### 1.5 Empiirinen löydös: ts_parser natiivina (2026-06-08)

`scripts/compile-ts-parser-llvm.sh` kääntää nyt `ts_parser_main`:in natiiviksi (LLVM IR -> clang). Tilanne:

| Vaihe | Tila |
|-------|------|
| LLVM IR -generointi | toimii |
| Linkitys (clang) | **toimii** – oikea blokkeri oli puuttuva `runtime/ranger_mem.c` linkityksestä (ei `itemAt`/indeksointi, kuten vanha note väitti) |
| Tokenisointi natiivina | **toimii täysin** – tokenit täsmäävät JS-versioon (interface/type/let/const/function ... EOF) |
| Parse-vaihe | **toimii** – koko AST tulostuu natiivina (interface/type/var/function/Array<string>), `0` ASan-virhettä |

**Tämän kierroksen korjaukset (oikeita bugeja, eivät workaroundeja):**
- Linkkiskripti linkittää `ranger_mem.c`:n; `ranger_strdup` `ranger_mem.c`:ssä `__attribute__((weak))` ettei törmää `ranger_rt.c`:hen.
- `lowerReturn`: palautettu collection-lokaali ([T]) merkitään escapediksi -> ei vapauteta callee:ssa (oli use-after-free: `tokenize()` vapautti palauttamansa arrayn).
- `emitReleaseOwnedLocals`: escaped-collectionit ohitetaan.
- `lowerVarDef` call-polku: funktiosta palautettu collection sidotaan ptr-array/array/map-slotiksi -> `for`/`array_length`/`itemAt` toimivat (oli "[Token] indexing").

**Parse-vaiheen kaatumisen juurisyy ratkaistu (kaksi erillistä bugia):**

1. **Aliasoidut object-/array-kentät vapautettiin kahdesti (double-free).** Parserin oliograafissa on **lainattuja** viittauksia: `currentToken` osoittaa `tokens`-arrayn elementtiin, AST-kentät `left`/`right`/`body` aliasoivat toisia node:ja, ja `parser.tokens = toks` aliasoi kutsujan omistaman kokoelman. Aiemmin object- ja ptr-array-kentät merkittiin `owned=1` -> destruktori vapautti ne rekursiivisesti, vaikka oikea omistaja vapautti saman objektin/arrayn jo muualta.
   **Korjaus:** object- (`kind=1`) ja ptr-array-kentät (`kind=2`) ovat nyt **borrow oletuksena** (`owned=0` type descriptorissa; ei retain tallennuksessa; ei release ylikirjoituksessa; C-destruktori kunnioittaa `owned`-lippua). String-kentät pysyvät owned (oma `strdup`-kopio). Kun owned-lokaali tallennetaan object-kenttään, se merkitään escapediksi (estää dangling-viittauksen).

2. **Ehtohaarassa määritelty owned-lokaali vapautettiin alustamattomana (BUS/SIGSEGV).** Esim. `advance()`:n `def eof (new Token())` else-haarassa, tai collection-lokaali joka jää alustamatta yhdellä polulla, vapautettiin silti scope-lopussa -> alloca-slot sisälsi roskaa -> `ranger_obj_release`/`ranger_ptrarray_release` roska-osoitteella.
   **Korjaus:** `bindSlot` nollaa uudet pointer-slotit funktion entry-blokissa (ennen arvon storea) manuaalisen muistinhallinnan targeteilla. Suorittamaton haara -> slot = `NULL` -> release on suojattu no-op. (WASM ym. ohitetaan `memEnabled`-ehdolla.)

**Tila:** `ts_parser_main -d` ajaa natiivina päästä päähän, koko AST täsmää JS-referenssiin, AddressSanitizer raportoi `0` virhettä. Kaikki 35 LLVM-testiä vihreänä.

**Välitila (Vaihe 3:n proper borrow-analyysi viimeistelee):** borrow-by-default on *turvallinen mutta konservatiivinen* – object-/array-kentät, jotka tosiasiassa omistavat (esim. AST-puun `children` rakennettuna paikan päällä), eivät enää vapaudu automaattisesti -> ne **vuotavat** kunnes proper borrow-analyysi (§1.4 `OwnershipKind`) osaa promotoida todistetusti omistetut kentät takaisin `owned`-tilaan. Vuoto >> kaatuminen, ja tämä on dokumentoitu välitavoite.

> **Huom.** Vaiheet 0–2 toimivat jo *konservatiivisella* tiukkuudella LLVM/libc:lle: kun omistajuus on epäselvä, valitaan turvallinen retain/release. Vaihe 3:n optimoinnit (escape/pure/move) vain *löysentävät* tätä silloin kun analyysi todistaa sen turvalliseksi – ne eivät saa rikkoa konservatiivista oletusta.

---

## 2. Tavoite

**Deterministinen, kevyt deallokaatio ilman täyttä GC:tä.**

```
Ranger-lähde -> Omistajuusanalyysi -> Target-adapteri -> Manuaalinen: LLVM IR (retain/release/free)
                                                       -> Strict:      Rust borrow-tyypit
                                                       -> Hallittu:    no-op (GC/ARC)
                                                       -> Freestanding: arena/bump
```

---

## 3. Objekti-header ja type descriptor

### 3.1 Header ennen structia (toteutettu)

```c
typedef struct {
  uint32_t rc;
  uint32_t size;
  const RangerTypeDesc *type;   // toteutettu: korvasi pelkän destroy-fn:n
  uint32_t _pad;
} RangerObjHeader;

// Muisti: [RangerObjHeader][struct bytes...]
// i64 osoitin = struct body (nykyinen Ranger-koodi)
```

### 3.2 Type descriptor (toteutettu)

`RangerTypeDesc` + `RangerFieldDesc` kuvaavat kentät, jotta `ranger_obj_release` osaa vapauttaa rekursiivisesti string/object/ptr-array-kentät.

```c
#define RT_FIELD_STRING    0
#define RT_FIELD_OBJECT    1
#define RT_FIELD_PTR_ARRAY 2

typedef struct {
  uint32_t offset;
  uint8_t  kind;    // RT_FIELD_*
  uint8_t  owned;   // 1 = strong (vapauta), 0 = weak
  uint8_t  _pad[2];
} RangerFieldDesc;

typedef struct {
  uint32_t struct_size;
  uint16_t field_count;
  uint16_t _pad;
  const RangerFieldDesc *fields;
} RangerTypeDesc;
```

Kääntäjä emittoi nämä LLVM-globaaleina (`@Class_typeDesc`, `@Class_typeFields`).

### 3.3 Kolme osoitintyyppiä

| Tyyppi | Merkitys |
|--------|----------|
| **Owned** (`strong`) | Omistaja, vapauttaa kun rc->0 |
| **Borrowed** (`weak`) | Laina, ei vapauta |
| **Transferred** (`moves`) | Omistajuus siirtyy |

---

## 4. Push-semantiikka (toteutettu + suunnitelma)

- **Vaihe 2 (toteutettu):** owned-lokaalin `push` = **move** (ei retainia, lokaali escaped). Muu arvo: `ranger_ptrarray_push_owned` (retain).
- **Vaihe 3:** `push_move` myös ei-triviaaleissa tapauksissa kun escape-analyysi varmistaa siirron; redundanttien retain/release-parien poisto.

---

## 5. Staattinen analyysi (vaihe 3 – optimointi)

Hyödynnetään olemassa olevaa infraa:
- `StaticAnalyzer` (`ng_StaticAnalysis.rgr`) – mutation/borrow C++/Rustille (ajetaan nyt vain cpp/rust).
- `ref_cnt` (parse-aikainen) – käyttölaskenta, dead-local-poisto, Rust-clone.
- `@(moves)` / `@(pure)` (operaattorit) – omistajuussiirto ja puhtaus.

**Vaihe 3:n työ:** kytke tämä omistajuustieto myös LLVM-polkuun (target-adapteri, §1.4) ja aja escape/pure-analyysi optimointikerroksena. Analyysi on optimointi – vaiheet 0–2 toimivat konservatiivisella retain/releasella ilman sitä.

---

## 6. Runtime API

**Toteutettu** (`runtime/ranger_mem.c`):

```c
int64_t ranger_obj_new(uint32_t size, const RangerTypeDesc *type);
void    ranger_obj_retain(int64_t body);
void    ranger_obj_release(int64_t body);          // rekursiivinen kenttävapautus type descin kautta
void    ranger_str_release(char *s);
char   *ranger_strdup(const char *text);
void    ranger_ptrarray_release(int64_t desc);     // vapauttaa owned-elementit + arrayn
void    ranger_ptrarray_push_owned(int64_t desc, int64_t val);  // retain + push
int     ranger_mem_live_objects(void);             // testit
void    ranger_mem_reset_stats(void);
```

---

## 7. LLVM-koodigenerointi

### 7.1 Toteutetut insertointikohdat

| Kohde | Toiminto |
|-------|----------|
| `lowerNewObject` | `ranger_obj_new(size, @Class_typeDesc)` libc-kohteissa |
| `lowerTypeDesc` | `@Class_typeDesc` + `@Class_typeFields` globaalit |
| Funktion `ret` / scope-loppu | `ranger_obj_release` owned-lokaaleille (ellei escaped) |
| `lowerReturn` | escape-local ei release (caller omistaa) |
| `emitFieldStoreOn` | string: release vanha + strdup uusi; object/ptr-array: borrow (ei retain/release) |
| `lowerPush` | owned-lokaali = move; muu = `ranger_ptrarray_push_owned` |
| `lowerStringConcat` | strdup + `free` bufferi |
| `RangerMem_*` | intrinsics -> `ranger_mem_*` |

### 7.2 Tulossa (Vaihe 3)

| Kohde | Toiminto |
|-------|----------|
| Target-luokittelu | `memoryModel()` valmis; täysi jaettu malli LLVM + Rust kesken |
| Escape/pure-pass | redundantti retain/release pois |
| Arena | `@(arena)` tokenize/parse-polulle |
| ts_parser flat-profiili | natiivi `liveObjects()`-tarkistus oikealla työkuormalla |

---

## 8. Toteutusvaiheet

### Vaihe 0 – MVP-perusta (valmis)

- [x] `RangerObjHeader` C-runtime (`runtime/ranger_mem.c`)
- [x] Kääntäjä generoi `RangerTypeDesc` globaalit (LLVM data)
- [x] `ranger_obj_new` / `ranger_obj_release`
- [x] `emitHeapAlloc` -> `ranger_obj_new` (libc)
- [x] `ranger_str_release` + concat-puskurien `free`
- [x] Funktion lopun local-cleanup
- [x] Testit: `llvm_mem_trivial`, `llvm_mem_loop` (1000 allokointia)

### Vaihe 1 – Kenttädestructorit (valmis)

- [x] `ranger_obj_release` kenttälista `RangerTypeDesc`:n kautta
- [x] Owned object -kentät rekursiivisesti
- [x] String-kentät: `ranger_str_release`
- [x] Kenttäassign: release vanha, retain/strdup uusi (string); object/ptr-array borrow
- [x] Testit: `llvm_mem_string.rgr`, `llvm_mem_field_assign.rgr`
- [ ] Optional-kentät: null-tarkistus (osittain – release tarkistaa nollan)

### Vaihe 2 – Arrayt (valmis)

- [x] `RtPtrArray` omistaa elementit (`owned`-flag descriptorissa)
- [x] `push owned` -> move / `ranger_ptrarray_push_owned`
- [x] `ranger_ptrarray_release`
- [x] Testi: `llvm_mem_ptrarray.rgr`
- [x] Testi: parser-proxy skaala -> `llvm_mem_parser_sim.rgr` (1000 objektia, rekursiivinen token+string-kenttä-vapautus, pysyy flattina)

### Vaihe 3 – Target-tiukkuus + Move / escape / pure -analyysi

- [x] Target-luokittelu kanoniseksi: `LowIRTarget.memoryModel()` -> `manual` / `freestanding`, `isManualMemory()`
- [x] `-strict-ownership` lippu: manual-targetilla emittoi per-funktio omistajuusyhteenvedon IR-kommentteina (`; ownership[manual]: ...`)
- [x] `emitComment` LowIR-builderiin + writer-tuki (`op == "comment"`)
- [x] ts_parser natiivi: link + tokenisointi + parse (borrow-by-default + entry-zero-init)
- [ ] Yhteinen `OwnershipKind`-malli + täysi target-adapteri (manuaalinen / strict / hallittu / freestanding)
- [ ] `-strict-ownership`: tunnistamaton omistajuus -> varoitus/virhe (ei vain kommentti)
- [ ] `@(pure)` + `consumes`/`escapes` per metodi LLVM-polulle
- [ ] `push_move` optimointi epätriviaaleille tapauksille
- [ ] Singleton / static erottelu
- [ ] `ts_parser_main` natiivi flat-muistiprofiili (`liveObjects()` oikealla työkuormalla)

### Vaihe 4 – Arena ja optimointi

- [ ] `@(arena)` tokenize/parse-polku
- [ ] Redundantti retain/release -poisto
- [ ] LLVM-pass

---

## 9. Arena parserille

Suositus: arena `tokenize`/`parseProgram` -poluille. Tokenit, väliaikaiset AST-nodet ja concat-bufferit ovat juuri sitä lyhytikäistä dataa, jossa arena antaa ison hyödyn pienellä kompleksisuudella. Tämä on Vaihe 3/4:n optimointi, joka asettuu hallitun cleanupin rinnalle.

---

## 10. Mitä EI tehdä

- Täyttä tracing GC:tä
- Automaattista `weak` kaikille parametreille
- `@llvm.gcroot`
- Eksplisiittistä release/free hallituilla targeteilla (GC/ARC hoitaa)

---

## 11. Yhteenveto

| Lähestymistapa | Prioriteetti | Tila |
|----------------|--------------|------|
| Header + type descriptor | 0 | valmis |
| Local cleanup | 0 | valmis |
| Kenttädestructorit (string/object) | 1 | valmis |
| Array own/release | 2 | valmis |
| Target-kohtainen ownership-tiukkuus | 3 | aloitettu (memoryModel + -strict-ownership diagnostiikka) |
| Move/escape/pure -analyysi | 3 | suunniteltu |
| Arena | 3–4 | suunniteltu |
| Parser-proxy flat-skaalatesti | 2 | valmis |
| ts_parser natiivi: link + tokenisointi + parse | 3 | valmis |
| ts_parser parse-vaihe (ARC double-free) | 3 | **valmis** – borrow-by-default kentille + entry-zero-init; koko AST natiivina, 0 ASan-virhettä |
| Proper borrow-analyysi (promotoi owned-kentät) | 3 | suunniteltu (poistaa borrow-by-default-vuodot) |
