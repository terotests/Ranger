# Ranger LLVM ù muistinhallintasuunnitelma

Tùmù dokumentti kuvaa muistinhallintastrategian Rangerin LLVM-backendille. Katso myùs [PLAN_STATIC_ANALYSIS.md](./PLAN_STATIC_ANALYSIS.md) olemassa olevaan staattisen analyysin infraan (C++/Rust).

## Toteutuksen eteneminen (2026-06-08)

**Vaihe 0 + Vaihe 1 + Vaihe 2 valmiit, Vaihe 3 aloitettu.** `npm run test:llvm` -> 35/35, koko sarja `npm test` -> 327 passed / 3 skipped (ei regressioita).

| Kohde | Tila |
|-------|------|
| `runtime/ranger_mem.c` ù header + rc + RangerTypeDesc | valmis |
| `ranger_obj_new` / `ranger_obj_release` (libc-kohteet) | valmis |
| `RangerTypeDesc` / `RangerFieldDesc` globaali data LLVM IR:ssa | valmis |
| Generinen kenttùdestruktio (string/object/ptr-array, owned-flag) | valmis |
| `lowerNewObject` -> `ranger_obj_new(size, @Class_typeDesc)` | valmis |
| Funktion lopun local-cleanup (`ownedObjectLocals`) | valmis |
| Return-escape: palautettu object local ei release | valmis |
| Loop-uudelleenmùùrittely: release vanha ennen uutta `new` | valmis |
| Kenttùassign: release vanha arvo + retain/strdup uusi | valmis |
| Concat: strdup + `free` alkuperùinen bufferi | valmis |
| Ptr-array: owned-elementit, `ranger_ptrarray_release` | valmis |
| Push owned-lokaali = **move** (ei retainia, lokaali merkitùùn escaped) | valmis |
| `RangerMem` intrinsics testeissù | valmis |
| Testit: trivial, loop, string, field_assign, ptrarray, parser_sim | valmis |

**Push-semantiikka (pùùtùs):** owned-lokaalin push arrayhin on **move** ù array ottaa olemassa olevan referenssin, lokaalia ei vapauteta funktion lopussa. Tùmù on oikein koska silmukan runko lowerataan kerran (per-iteraatio retain/release ei toimisi ilman per-iteraatio scope-cleanupia). Borrowed/ei-lokaali arvo pushataan edelleen `ranger_ptrarray_push_owned`-kutsulla (retain).

**Toteutetut tiedostot:** `runtime/ranger_mem.c`, `compiler/ng_LowIRBuilder.rgr`, `compiler/ng_LowIR.rgr`, `compiler/ng_LLVMIRWriter.rgr`, `compiler/ng_LowIRRuntime.rgr`, `tests/fixtures/llvm_mem_*.rgr`, `tests/compiler-llvm.test.ts`

**Seuraavaksi (Vaihe 3):** proper borrow-analyysi (promotoi todistetusti owned-kentùt, poista borrow-by-default-vuodot); sitten `ts_parser_main` natiivi flat-muistiprofiili.

---

## Ydinperiaate

**ùlù tee tùyttù GC:tù.** Staattinen cleanup + kevyt RC + arena on Rangerille jùrkevùmpi kuin tracing GC. Kolme kerrosta tùydentùvùt toisiaan:

| Kerros | Rooli |
|--------|-------|
| **Staattinen cleanup** | Paikalliset lokaalit, concat-puskurit ù suora `free` ilman rc:tù |
| **Kevyt RC** | Kentùt, push, return ù `retain`/`release` kun omistajuus ei ole triviaalinen |
| **Arena** | Parser/Lexer ù tokenit, vùliaikaiset AST-nodet, concat-bufferit |

---

## 1. Target-kohtainen ownership-tiukkuus (Vaihe 3:n ydinperiaate)

Eri kùùnnùskohteilla on eri muistimallit. Kùùntùjùn **omistajuus- ja vapautuskùsittelyn tiukkuuden tulee skaalautua targetin mukaan.** Sama Ranger-lùhde tuottaa eritasoiset tarkistukset riippuen siitù, onko targetilla jo muistinhallinta vai ei.

### 1.1 Targettien muistimalliluokat

| Luokka | Targetit | Kuka vapauttaa | Kùùntùjùn vastuu |
|--------|----------|----------------|------------------|
| **Manuaalinen** | LLVM + libc, C | Kùùntùjùn generoima RC/cleanup | **Tiukin** ù jokainen owned-objekti pitùù vapauttaa tùsmùlleen kerran |
| **Strict ownership** | Rust | Kielen oma borrow checker | **Tiukka** ù omistajuus/borrow pitùù olla yksiselitteinen, muuten kùùntùjù hylkùù |
| **Hallittu (GC/RC runtime)** | JS/TS, Go, Java, C#, Python, Swift (ARC) | Runtimen GC/ARC | **Lùysin** ù ei tarvita eksplisiittistù release/free |
| **Freestanding** | WASM bump-alloc, freestanding | Ei vapauteta (areena/bump) | **Erikois** ù RC pois, arena hoitaa |

### 1.2 Periaate: ownership-tiukkuus on funktio targetista

```
ownershipStrictness(target) =
    Manuaalinen      -> EksaktiRC          (release-pakko, leak = bugi)
    StrictOwnership  -> BorrowTarkistus    (move/borrow yksiselitteinen)
    Hallittu         -> EiTarkistuksia     (runtime hoitaa)
    Freestanding     -> ArenaTaiBump       (ei per-objekti vapautusta)
```

Konkreettisesti tùmù tarkoittaa, ettù **sama omistajuusanalyysi ajetaan aina, mutta sen tulosten *pakottavuus* ja *mihin koodiin se kùùntyy* riippuu targetista:**

| Analyysitulos | Manuaalinen (LLVM/C) | Strict (Rust) | Hallittu (JS/GC) |
|---------------|----------------------|---------------|------------------|
| owned local, ei escape | `ranger_obj_release` scope-lopussa | drop (implisiittinen) | ei mitùùn |
| owned siirtyy (move/push) | move ù ei release | `move` / ownership transfer | ei mitùùn |
| borrowed param | ei release | `&T` / `&mut T` | ei mitùùn |
| epùselvù omistajuus | **konservatiivinen retain/release** | **kùùnnùsvirhe / clone** | ei mitùùn |
| escape returnin kautta | ei release (caller omistaa) | palautettu omistajuus | ei mitùùn |

### 1.3 Miksi tùmù on tùrkeùù nyt

- **LLVM/libc on tiukin asiakas.** Jos analyysi on epùvarma omistajuudesta, manuaalisella targetilla *pitùù* valita konservatiivinen retain/release (ennemmin ylimùùrùinen retain kuin vuoto/double-free). Tùmù on jo nykytilan oletus.
- **Rust hyùtyy samasta analyysistù mutta eri lopputuloksella.** `StaticAnalyzer` (`ng_StaticAnalysis.rgr`) tuottaa jo `rust_borrow_type` (0=owned, 1=borrow, 2=mut_borrow). Sama omistajuustieto pitùisi jakaa LLVM-polun kanssa.
- **Hallituilla targeteilla turha release on haitallista** ù ei vain hyùdytùntù vaan voi olla vùùrin (double-managed). Siksi `memEnabled` portittaa RC:n jo nyt `usesLibc`-lipulla.

### 1.4 Toteutuksen suunta

1. **Yhteinen omistajuusmalli** (`OwnershipKind`: `owned` / `borrowed` / `moved` / `static`) lasketaan kerran AST/flow-tasolla, riippumatta targetista.
2. **Target-adapteri** kùùntùù omistajuustuloksen target-spesifiksi koodiksi:
   - Manuaalinen: retain/release/free + cleanup-pisteet (nykyinen `ng_LowIRBuilder.rgr`-polku).
   - Rust: borrow-tyypit (nykyinen `StaticAnalyzer`).
   - Hallittu/freestanding: no-op / arena.
3. **Tiukkuuslippu** (`-strict-ownership` tms.) sallii LLVM-targetille varoituksen/virheen, jos owned-objektin elinkaarta ei voida todistaa (leak-riski). Hallituilla targeteilla lippu on no-op.

### 1.5 Empiirinen lùydùs: ts_parser natiivina (2026-06-08)

`scripts/compile-ts-parser-llvm.sh` kùùntùù nyt `ts_parser_main`:in natiiviksi (LLVM IR -> clang). Tilanne:

| Vaihe | Tila |
|-------|------|
| LLVM IR -generointi | toimii |
| Linkitys (clang) | **toimii** ù oikea blokkeri oli puuttuva `runtime/ranger_mem.c` linkityksestù (ei `itemAt`/indeksointi, kuten vanha note vùitti) |
| Tokenisointi natiivina | **toimii tùysin** ù tokenit tùsmùùvùt JS-versioon (interface/type/let/const/function ... EOF) |
| Parse-vaihe | **toimii** ù koko AST tulostuu natiivina (interface/type/var/function/Array<string>), `0` ASan-virhettù |

**Tùmùn kierroksen korjaukset (oikeita bugeja, eivùt workaroundeja):**
- Linkkiskripti linkittùù `ranger_mem.c`:n; `ranger_strdup` `ranger_mem.c`:ssù `__attribute__((weak))` ettei tùrmùù `ranger_rt.c`:hen.
- `lowerReturn`: palautettu collection-lokaali ([T]) merkitùùn escapediksi -> ei vapauteta callee:ssa (oli use-after-free: `tokenize()` vapautti palauttamansa arrayn).
- `emitReleaseOwnedLocals`: escaped-collectionit ohitetaan.
- `lowerVarDef` call-polku: funktiosta palautettu collection sidotaan ptr-array/array/map-slotiksi -> `for`/`array_length`/`itemAt` toimivat (oli "[Token] indexing").

**Parse-vaiheen kaatumisen juurisyy ratkaistu (kaksi erillistù bugia):**

1. **Aliasoidut object-/array-kentùt vapautettiin kahdesti (double-free).** Parserin oliograafissa on **lainattuja** viittauksia: `currentToken` osoittaa `tokens`-arrayn elementtiin, AST-kentùt `left`/`right`/`body` aliasoivat toisia node:ja, ja `parser.tokens = toks` aliasoi kutsujan omistaman kokoelman. Aiemmin object- ja ptr-array-kentùt merkittiin `owned=1` -> destruktori vapautti ne rekursiivisesti, vaikka oikea omistaja vapautti saman objektin/arrayn jo muualta.
   **Korjaus:** object- (`kind=1`) ja ptr-array-kentùt (`kind=2`) ovat nyt **borrow oletuksena** (`owned=0` type descriptorissa; ei retain tallennuksessa; ei release ylikirjoituksessa; C-destruktori kunnioittaa `owned`-lippua). String-kentùt pysyvùt owned (oma `strdup`-kopio). Kun owned-lokaali tallennetaan object-kenttùùn, se merkitùùn escapediksi (estùù dangling-viittauksen).

2. **Ehtohaarassa mùùritelty owned-lokaali vapautettiin alustamattomana (BUS/SIGSEGV).** Esim. `advance()`:n `def eof (new Token())` else-haarassa, tai collection-lokaali joka jùù alustamatta yhdellù polulla, vapautettiin silti scope-lopussa -> alloca-slot sisùlsi roskaa -> `ranger_obj_release`/`ranger_ptrarray_release` roska-osoitteella.
   **Korjaus:** `bindSlot` nollaa uudet pointer-slotit funktion entry-blokissa (ennen arvon storea) manuaalisen muistinhallinnan targeteilla. Suorittamaton haara -> slot = `NULL` -> release on suojattu no-op. (WASM ym. ohitetaan `memEnabled`-ehdolla.)

**Tila:** `ts_parser_main -d` ajaa natiivina pùùstù pùùhùn, koko AST tùsmùù JS-referenssiin, AddressSanitizer raportoi `0` virhettù. Kaikki 35 LLVM-testiù vihreùnù.

**Vùlitila (Vaihe 3:n proper borrow-analyysi viimeistelee):** borrow-by-default on *turvallinen mutta konservatiivinen* ù object-/array-kentùt, jotka tosiasiassa omistavat (esim. AST-puun `children` rakennettuna paikan pùùllù), eivùt enùù vapaudu automaattisesti -> ne **vuotavat** kunnes proper borrow-analyysi (ù1.4 `OwnershipKind`) osaa promotoida todistetusti omistetut kentùt takaisin `owned`-tilaan. Vuoto >> kaatuminen, ja tùmù on dokumentoitu vùlitavoite.

> **Huom.** Vaiheet 0ù2 toimivat jo *konservatiivisella* tiukkuudella LLVM/libc:lle: kun omistajuus on epùselvù, valitaan turvallinen retain/release. Vaihe 3:n optimoinnit (escape/pure/move) vain *lùysentùvùt* tùtù silloin kun analyysi todistaa sen turvalliseksi ù ne eivùt saa rikkoa konservatiivista oletusta.

---

## 2. Tavoite

**Deterministinen, kevyt deallokaatio ilman tùyttù GC:tù.**

```
Ranger-lùhde -> Omistajuusanalyysi -> Target-adapteri -> Manuaalinen: LLVM IR (retain/release/free)
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
  const RangerTypeDesc *type;   // toteutettu: korvasi pelkùn destroy-fn:n
  uint32_t _pad;
} RangerObjHeader;

// Muisti: [RangerObjHeader][struct bytes...]
// i64 osoitin = struct body (nykyinen Ranger-koodi)
```

### 3.2 Type descriptor (toteutettu)

`RangerTypeDesc` + `RangerFieldDesc` kuvaavat kentùt, jotta `ranger_obj_release` osaa vapauttaa rekursiivisesti string/object/ptr-array-kentùt.

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

Kùùntùjù emittoi nùmù LLVM-globaaleina (`@Class_typeDesc`, `@Class_typeFields`).

### 3.3 Kolme osoitintyyppiù

| Tyyppi | Merkitys |
|--------|----------|
| **Owned** (`strong`) | Omistaja, vapauttaa kun rc->0 |
| **Borrowed** (`weak`) | Laina, ei vapauta |
| **Transferred** (`moves`) | Omistajuus siirtyy |

---

## 4. Push-semantiikka (toteutettu + suunnitelma)

- **Vaihe 2 (toteutettu):** owned-lokaalin `push` = **move** (ei retainia, lokaali escaped). Muu arvo: `ranger_ptrarray_push_owned` (retain).
- **Vaihe 3:** `push_move` myùs ei-triviaaleissa tapauksissa kun escape-analyysi varmistaa siirron; redundanttien retain/release-parien poisto.

---

## 5. Staattinen analyysi (vaihe 3 ù optimointi)

Hyùdynnetùùn olemassa olevaa infraa:
- `StaticAnalyzer` (`ng_StaticAnalysis.rgr`) ù mutation/borrow C++/Rustille (ajetaan nyt vain cpp/rust).
- `ref_cnt` (parse-aikainen) ù kùyttùlaskenta, dead-local-poisto, Rust-clone.
- `@(moves)` / `@(pure)` (operaattorit) ù omistajuussiirto ja puhtaus.

**Vaihe 3:n tyù:** kytke tùmù omistajuustieto myùs LLVM-polkuun (target-adapteri, ù1.4) ja aja escape/pure-analyysi optimointikerroksena. Analyysi on optimointi ù vaiheet 0ù2 toimivat konservatiivisella retain/releasella ilman sitù.

---

## 6. Runtime API

**Toteutettu** (`runtime/ranger_mem.c`):

```c
int64_t ranger_obj_new(uint32_t size, const RangerTypeDesc *type);
void    ranger_obj_retain(int64_t body);
void    ranger_obj_release(int64_t body);          // rekursiivinen kenttùvapautus type descin kautta
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
| Target-luokittelu | `memoryModel()` valmis; tùysi jaettu malli LLVM + Rust kesken |
| Escape/pure-pass | redundantti retain/release pois |
| Arena | `@(arena)` tokenize/parse-polulle |
| ts_parser flat-profiili | natiivi `liveObjects()`-tarkistus oikealla tyùkuormalla |

---

## 8. Toteutusvaiheet

### Vaihe 0 ù MVP-perusta (valmis)

- [x] `RangerObjHeader` C-runtime (`runtime/ranger_mem.c`)
- [x] Kùùntùjù generoi `RangerTypeDesc` globaalit (LLVM data)
- [x] `ranger_obj_new` / `ranger_obj_release`
- [x] `emitHeapAlloc` -> `ranger_obj_new` (libc)
- [x] `ranger_str_release` + concat-puskurien `free`
- [x] Funktion lopun local-cleanup
- [x] Testit: `llvm_mem_trivial`, `llvm_mem_loop` (1000 allokointia)

### Vaihe 1 ù Kenttùdestructorit (valmis)

- [x] `ranger_obj_release` kenttùlista `RangerTypeDesc`:n kautta
- [x] Owned object -kentùt rekursiivisesti
- [x] String-kentùt: `ranger_str_release`
- [x] Kenttùassign: release vanha, retain/strdup uusi (string); object/ptr-array borrow
- [x] Testit: `llvm_mem_string.rgr`, `llvm_mem_field_assign.rgr`
- [ ] Optional-kentùt: null-tarkistus (osittain ù release tarkistaa nollan)

### Vaihe 2 ù Arrayt (valmis)

- [x] `RtPtrArray` omistaa elementit (`owned`-flag descriptorissa)
- [x] `push owned` -> move / `ranger_ptrarray_push_owned`
- [x] `ranger_ptrarray_release`
- [x] Testi: `llvm_mem_ptrarray.rgr`
- [x] Testi: parser-proxy skaala -> `llvm_mem_parser_sim.rgr` (1000 objektia, rekursiivinen token+string-kenttù-vapautus, pysyy flattina)

### Vaihe 3 ù Target-tiukkuus + Move / escape / pure -analyysi

- [x] Target-luokittelu kanoniseksi: `LowIRTarget.memoryModel()` -> `manual` / `freestanding`, `isManualMemory()`
- [x] `-strict-ownership` lippu: manual-targetilla emittoi per-funktio omistajuusyhteenvedon IR-kommentteina (`; ownership[manual]: ...`)
- [x] `emitComment` LowIR-builderiin + writer-tuki (`op == "comment"`)
- [x] ts_parser natiivi: link + tokenisointi + parse (borrow-by-default + entry-zero-init)
- [x] **Omistajuusinferenssi (Phase A, analyysi+diagnostiikka)**: `OwnershipKind` per parametri johdetaan staattisesti escape-summarysta, ks. ù12. Raportoidaan `-strict-ownership`-lipulla, ei codegen-muutosta.
- [~] Yhteinen `OwnershipKind`-malli + target-adapteri: inferenssi valmis (target-riippumaton); adapterin kytkentù LowIR/Rust-codegeniin kesken (Phase B/C)
- [~] `-strict-ownership`: raportoi pùùteltyn `OwnershipKindin` + varoittaa ratkaisemattomista (escapes via call ? tarvitsee interproseduraalisen summaryn); kova virhe-tila myùhemmin
- [~] `@(pure)` + `consumes`/`escapes`: **johdetaan staattisesti** (ei lùhdeannotaatioita) ù `pure`-oikotie + field-store/member-push -inferenssi tuottaa consumes/escapes-pùùtelmùt; annotaatiot voivat myùhemmin toimia valinnaisina assertioina
- [ ] Interproseduraalinen propagointi (Phase B): kutsupaikalla `consumes`-param ? merkitse argumentti escapediksi; promotoi todistetusti owned-kentùt
- [ ] `push_move` optimointi epùtriviaaleille tapauksille (vaatii Phase B:n escape-summaryn)
- [ ] Singleton / static erottelu
- [ ] `ts_parser_main` natiivi flat-muistiprofiili (`liveObjects()` oikealla tyùkuormalla)

### Vaihe 4 ù Arena ja optimointi

- [ ] `@(arena)` tokenize/parse-polku
- [ ] Redundantti retain/release -poisto
- [ ] LLVM-pass

---

## 9. Arena parserille

Suositus: arena `tokenize`/`parseProgram` -poluille. Tokenit, vùliaikaiset AST-nodet ja concat-bufferit ovat juuri sitù lyhytikùistù dataa, jossa arena antaa ison hyùdyn pienellù kompleksisuudella. Tùmù on Vaihe 3/4:n optimointi, joka asettuu hallitun cleanupin rinnalle.

---

## 10. Mitù EI tehdù

- Tùyttù tracing GC:tù
- Automaattista `weak` kaikille parametreille
- `@llvm.gcroot`
- Eksplisiittistù release/free hallituilla targeteilla (GC/ARC hoitaa)

---

## 11. Yhteenveto

| Lùhestymistapa | Prioriteetti | Tila |
|----------------|--------------|------|
| Header + type descriptor | 0 | valmis |
| Local cleanup | 0 | valmis |
| Kenttùdestructorit (string/object) | 1 | valmis |
| Array own/release | 2 | valmis |
| Target-kohtainen ownership-tiukkuus | 3 | aloitettu (memoryModel + -strict-ownership diagnostiikka) |
| Move/escape/pure -analyysi | 3 | Phase A valmis (inferenssi+diagnostiikka, ù12); codegen-kytkentù Phase B/C |
| Arena | 3ù4 | suunniteltu |
| Parser-proxy flat-skaalatesti | 2 | valmis |
| ts_parser natiivi: link + tokenisointi + parse | 3 | valmis |
| ts_parser parse-vaihe (ARC double-free) | 3 | **valmis** ù borrow-by-default kentille + entry-zero-init; koko AST natiivina, 0 ASan-virhettù |
| Proper borrow-analyysi (promotoi owned-kentùt) | 3 | suunniteltu (poistaa borrow-by-default-vuodot) |

---

## 12. Omistajuusinferenssi (inferenssi-ensin, Phase A ñ 2026-06-08)

**Periaate: Ranger pysyy l‰pin‰kyv‰n‰.** Omistajuutta ei annotoida k‰sin ñ se **p‰‰tell‰‰n staattisesti** siit‰ miten arvoja k‰ytet‰‰n. `consumes`/`escapes` ovat analyysin *tulos*, eiv‰t l‰hdeannotaatioita. (Annotaatiot voivat myˆhemmin toimia valinnaisina assertioina, jotka analyysi tarkistaa.)

**Ydinidea:** omistajuus on **objektigraafin elinkaari**, ei funktion. `parent.left = child` ei kerro funktiosta mit‰‰n ñ se kertoo ett‰ `child` tallennetaan `parent`:n graafiin, ja `parent`:n elinkaari ratkaisee. T‰m‰ on escape-analyysi per-funktio summaryll‰.

### 12.1 Inferenssis‰‰nnˆt (havaittavat AST-kuviot)

| Kuvio | P‰‰telm‰ (`OwnershipKind`) |
|-------|----------------------------|
| `x.field = p` (object-kentt‰-store) | `p` ? **moved** omistajaan `x.field` |
| `push x.coll p` / `push tokens p` (member/param-kokoelma) | `p` ? **moved** omistajaan |
| `return p` | `p` ? **moved** (escapes kutsujalle) |
| `p` vain luettuna / pure-funktio | `p` ? **borrowed** |
| `p` ?2 eri omistajaan | **shared** (vaatii RC/Rc) |
| `p` v‰litetty toiselle (ei-pure) kutsulle | **unknown** ? varoitus (tarvitsee interproseduraalisen summaryn, Phase B) |
| primitiivit (int/double/bool/char/string) | aina **borrowed** (kopioidaan, ei siirret‰) |

`pure`-funktio on oikotie: se ei koskaan siirr‰ argumenttiensa omistajuutta ? kaikki ref-argit borrowed.

### 12.2 Toteutus

- **Talletus** (`RangerAppParamDesc`): `ownership_kind` (0=unknown,1=owned,2=borrowed,3=moved,4=shared), `ownership_resolved`, `escapes_via`, `escape_owners:[string]`, `escape_via_call`.
- **Analyysi** (`StaticAnalyzer.analyzeOwnershipAll`): `walkForEscapes` ker‰‰ escape-faktat, `finalizeOwnership` luokittelee + raportoi. Target-riippumaton; ei aja Rust-spesifej‰ passeja.
- **Kytkent‰** (`VirtualCompiler`): ajetaan kun `-strict-ownership` on p‰‰ll‰, mille tahansa targetille. **Ei codegen-muutosta** (Phase A).
- **Diagnostiikka**: per-funktio yhteenveto `ownership[infer] fn <nimi>: param '<p>' -> <kind> (<omistajat>)` + `WARNING` ratkaisemattomista.

### 12.3 Validointi

- Fixture `tests/fixtures/llvm_ownership_infer.rgr` + testit `tests/compiler-ownership.test.ts` (6 testi‰): `attach(parent child)` ? `child` moved `parent.left`, `parent` borrowed; `addToken(t)` ? `t` moved `tokens`; primitiivi `v` borrowed; read-only `a`/`b` borrowed.
- **ts_parser** (`-strict-ownership`): k‰‰ntyy puhtaasti, 31 funktiota, ei kraashia, ei v‰‰ri‰ varoituksia. Ainoa moved: `initParser: toks -> moved (this.tokens)` ñ **t‰sm‰lleen ß1.21:n aliasointitapaus**, jonka inferenssi tunnistaa oikein consumeksi. T‰m‰ on perusta Phase B:n interproseduraaliselle propagoinnille (kutsupaikka merkitsee `toks`:in escapediksi ? poistaa double-free/vuodon kunnolla).
- Koko sarja: 357 passed / 3 skipped, ei regressioita.

### 12.4 Seuraavaksi (Phase B ñ codegen-kytkent‰)

1. **Interproseduraalinen propagointi**: kiintopiste-iteraatio (kuten `analyzeClassTransitiveMutBorrow`) joka ratkaisee `escape_via_call`-tapaukset callee-summaryista.
2. **LowIR kuluttaa summaryn**: korvaa ad-hoc `escapedLocals`-heuristiikat; promotoi todistetusti owned-kent‰t takaisin owned-tilaan (poistaa borrow-by-default-vuodon).
3. **Rust-mappays**: `ownership_kind ? rust_borrow_type` (moved?by-value, borrowed?`&`); `shared ? rust_needs_rc_wrap` (Rc).
4. `-strict-ownership` kovaksi virheeksi ratkaisemattomille (object/collection) parametreille.
