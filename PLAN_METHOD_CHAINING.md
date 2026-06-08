# Ranger – method call chaining (fluent API)

Tämä dokumentti kuvaa suunnitelman method call chaining -syntaksiin tyyliin `obj.add(x).add(y).build()` sekä **operaattoriketjutukseen** tyyliin `str.substring(3, 4).trim()`. Ranger on käytännössä oliopohjainen; fluent builder -API:t, `Lang.rgr`-operaattorit ja parser-ketjut hyötyisivät tästä merkittävästi.

Operaattoripuolella tavoite on, että **määritelty operaattori toimii kuin tyyppikohtainen “type class” -instanssi**: jos `substring` on olemassa `string`-receiverille, syntaksi `str.substring(3, 4)` on sallittu ja ketjutettavissa – ei vain prefix-muoto `(substring str 3 4)`.

Katso myös [compiler/test_chain.rgr](./compiler/test_chain.rgr) (vanha kokeilu) ja [PLAN_STATIC_ANALYSIS.md](./PLAN_STATIC_ANALYSIS.md).

## Nykytila (2026-06-08, päivitetty)

### Edistyminen (topic/llvm)

| Vaihe | Tila | Huomio |
|-------|------|--------|
| 0 Golden testit | **valmis** | `tests/compiler-chain.test.ts` + `chain_*.rgr` (8 testiä) |
| 1 Codegen | **valmis** | `tryDesugarNewMethodChain` + `finalizeAsCallChainRoot`; `scripts/patch-chain-desugar.js` compile-patchin jälkeen |
| 2 Tyyppipäättely | **valmis** | Ketjun viimeisen kutsun paluutyyppi (`get()` → `int`); `cmdCall` + `clDesc`-receiver |
| **2b Polymorfinen ketjutus** | **seuraava** | ks. alla – overload + eri paluutyypit ketjussa, monikielinen codegen |
| **2c Operaattoriketjutus** | suunniteltu | `str.substring(3,4)` → `Lang.rgr`-operaattori; type-class-tyylinen resoluutio |
| 3 ChainDesugar-passi | avoin | |
| 4–5 Laajennukset | avoin | |

### Mitä on jo olemassa

Ketjutusinfra on **osittain toteutettu**, mutta hajallaan ja epätäydellinen:

| Komponentti | Tiedosto | Rooli |
|-------------|----------|-------|
| Ketjumuunnos (call-polku) | `ng_RangerFlowParser.rgr` → `cmdLocalCall` | Muuttaa `obj.foo() .bar()` → sisäkkäiset `call`-nodet |
| Ketjumuunnos (lausepolku) | `ng_RangerFlowParser.rgr` → `fixExpressionAssignmentChains` | `def x (obj.foo().bar())` ja vastaavat |
| Ketjumerkinnät | `CodeNode.is_part_of_chain`, `tag = "chainroot"` | Ohittaa duplikaattien walkin |
| Duplikaattilogiikka | `ng_parser_std_match.rgr`, `ng_FlowWork.rgr` | Vanhempia kopioita samasta ideasta |
| Koodigenerointi | `ng_RangerGenericClassWriter.CreateCallExpression` | Odottaa `has_call` + `call recv method args` -rakennetta |
| Testiluonnos | `compiler/test_chain.rgr` | `new myClass().second().bar()` jne. |

### Mitä toimii / ei toimi

**Toimii (vaiheet 0–2):**
- `new Acc().add(1).add(2).get()` → JS-codegen + paluutyyppi `int`
- `def n:int (new Acc()...get())`, `return (new Acc()...get())` metodissa
- Ketju paikallisesta muuttujasta: `b.add(2).get()` kun `b:Acc`
- Tyyppivirhe: `sfn run:Acc () { return ...get() }` hylätään oikein

**Ei vielä toimi / avoin:**
- **Polymorfinen overload ketjussa** – `.add(3)` vs `.add("Hello")` eri variantit ja eri paluutyypit (vaihe 2b)
- **Operaattoriketjutus** – `str.substring(3, 4).trim()` käyttäen `Lang.rgr`-operaattoreita (vaihe 2c)
- Staattinen `ClassName.run()` ei välitä paluutyyppiä `to_string`:lle (erillinen bugi)
- Yhtenäinen `ng_ChainDesugar`-passi (vaihe 3)
- LLVM-ketjutus, property-ketjut

**Syntaksirajoitukset:**
- Vaatii usein eksplisiittisen `new` (`Builder()` ilman `new` ei toimi konstruktorikutsuna).
- Ketjutus perustuu erillisiin `.method` -lapsenodeihin (ei yhtenäistä postfix-parseria).
- Vanha `test_chain.rgr` ei käänny nykyisellä kääntäjällä ilman virheitä.

### Juurisyyt (alkuperäiset – osa korjattu)

1. **Ketjumuunnos hajallaan** – `tryDesugarNewMethodChain` korjaa `new C().m().n()`-polun; `cmdLocalCall` / `fixExpressionAssignmentChains` edelleen rinnalla.
2. **`is_part_of_chain` + `hasNewOper`** – korjattu `finalizeAsCallChainRoot`:lla; täysi poisto vasta vaiheessa 3.
3. **Tyyppipäättely ketjussa** – korjattu sisäkkäisellä `call`-puulla + `clDesc`-receiver.
4. **Overload ketjussa** – seuraava työ: varianttiresoluutio + `compiledName` codegenissa kielille ilman overloadingia.

---

## Tavoitesyntaksi

```ranger
class Builder {
    fn add:Builder (x:int) {
        push items x
        return this
    }
    fn build:string () {
        return "ok"
    }
}

; Fluent builder
def result:string (new Builder().add(1).add(2).build())

; Lauseketju ilman sijoittamista
new Builder().add(1).add(2)

; Muuttuja välissä
def b:Builder (new Builder().add(1))
b.add(2).build()

; Ketju propertyyn (myöhempi vaihe)
; def name:string (obj.getUser().getName())

; Operaattoriketjutus (vaihe 2c) – Lang.rgr-operaattori postfix-tyyliin
def part:string (str.substring(3, 7).trim())
; vastaa: (trim (substring str 3 7))
; receiver-tyyppi valitsee oikean substring-variantin (string vs charbuffer jne.)

; Sekaketju: luokan metodi + operaattori
; def s:string (builder.build().trim())
```

**Ei-tavoitteet (v1):**
- Infix-operaattoriketjutus ilman pistettä (`a + b.map(...)`) – erillinen syntaksipäätös
- Optional chaining (`obj?.foo()`) – myöhempi
- `Builder()` ilman `new` – erillinen syntaksisokeri

---

## Arkkitehtuuriehdotus

### Ydinidea: yksi desugar-passi, yksi AST-muoto

```
Lähde (metodi):   recv.method1(a).method2(b).method3()
Lähde (operaattori): recv.op1(a).op2(b)     ; esim. str.substring(3,4).trim()

                ↓
Parse:  (nykyinen infix/call-rakenne säilyy toistaiseksi)
                ↓
Desugar (uusi passi tai yhdistetty):
        ; metodi:
        call(call(call(recv, method1, (a)), method2, (b)), method3, ())
        ; operaattori (vaihe 2c):
        oper(trim, (oper(substring, recv, (3), (4))))
                ↓
Typecheck:
        - metodi: eval_type = method3:n paluutyyppi
        - operaattori: stdParamMatch Lang.rgr:stä receiver-tyypin perusteella
                ↓
Codegen:
        - metodi: recv.method1(a).method2(b)...
        - operaattori: Lang.rgr-template (JS: str.substring(3,4).trim())
```

**AST-sopimus desugarin jälkeen:**
- Jokainen ketjun linkki on `CodeNode` jolla `has_call == true`
- Lapset: `[call, receiver, methodName, args]`
- `is_part_of_chain` ja `chainroot` **poistetaan** desugarin jälkeen (ei enää codegenin vastuulla)
- Ulomman noden `eval_type` = sisimmän/viimeisen kutsun paluutyyppi

### Vaihtoehto A (suositus): erillinen `ChainDesugarPass`

- Ajetaan `RangerFlowParser`-walkin jälkeen, ennen typecheckiä
- Yksi tiedosto: `ng_ChainDesugar.rgr`
- Korvaa `fixExpressionAssignmentChains` + `cmdLocalCall`-ketjuosion ajan myötä

### Vaihtoehto B: postfix-parseri

- Muuttaa parse-vaihetta: `expr` → `primary { '.' IDENT '(' args ')' }`
- Isompi refaktorointi, mutta selkeämpi pitkällä aikavälillä
- Vaatii yhteensovituksen nykyisen flow/infix-parserin kanssa

**Suositus:** aloita **vaiheesta A** (desugar-passi), siirry B:hen jos postfix-tarve kasvaa (esim. property-ketjut, generiikat).

---

## Toteutusvaiheet

### Vaihe 0 – Diagnoosi ja golden testit (1–2 pv) ✅

- [x] Fixture `tests/fixtures/chain_fluent_builder.rgr` (builder + sum/build)
- [x] Fixture `tests/fixtures/chain_new_method.rgr` (`new C().m().n()`)
- [x] Fixture `chain_local_var`, `chain_return_int`, `chain_return_type_mismatch`, `chain_var_continue`
- [x] `tests/compiler-chain.test.ts`: JS-output + ajettavuus (8 testiä)
- [x] Dokumentoitu rikkinäinen käyttäytyminen → korjattu

### Vaihe 1 – Korjaa codegen polku (2–3 pv) ✅

**Ongelma:** `is_part_of_chain` skip + `chainroot` ei synny `has_call`-nodena oikein.

**Työ (tehty):**
1. `tryDesugarNewMethodChain` muuttaa `new C().m().n()` → sisäkkäinen `call`-puu
2. `finalizeAsCallChainRoot` estää `hasNewOper`-skipin codegenissa
3. `scripts/patch-chain-desugar.js` säilyttää toteutuksen `npm run compile` -jälkeen

**Tiedostot:** `ng_CodeNodeCompilerExtensions.rgr`, `ng_RangerFlowParser.rgr` (`cmdNew`), `bin/output.js`

### Vaihe 2 – Tyyppipäättely ketjun läpi (1–2 pv) ✅

**Ongelma (korjattu):** `new Builder().add(1).sum()` tyypitettiin `Builder`:ksi, ei `int`:iksi.

**Työ (tehty):**
1. Sisäkkäinen `call`-puu: ulomman noden `eval_type` = valitun metodin paluutyyppi
2. `cmdCall`: receiverin `clDesc` → `eval_type_name` kun tyyppi puuttuu
3. Desugar-receiver: trimmatty `this.copy()` (säilyttää `hasNewOper` / luokkatiedot)

**Tiedostot:** `ng_RangerFlowParser.rgr`, `bin/output.js`

---

### Vaihe 2b – Polymorfinen ketjutus (overload + eri paluutyypit) **← seuraava**

**Tavoite:** ketjussa saa olla **sama metodinimi, eri argumenttityypit, eri paluutyyppi** – ja käännös toimii myös kielillä joissa **ei ole polymorfista metodi-overloadingia**.

**Esimerkkicase (testifixture):**

```ranger
class IntAcc {
    def v:int 0
    fn add:IntAcc (n:int) { v = (+ v n); return this }
    fn finish:int () { return v }
}

class StrAcc {
    def s:string ""
    fn add:StrAcc (t:string) { s = (s + t); return this }
    fn finish:string () { return s }
}

class PolyRoot {
    fn add:IntAcc (n:int) { def a:IntAcc (new IntAcc); a.add(n); return a }
    fn add:StrAcc (t:string) { def a:StrAcc (new StrAcc); a.add(t); return a }
}

class Main {
    sfn m@(main):void () {
        def n:int (new PolyRoot().add(3).finish())
        def s:string (new PolyRoot().add("Hello").finish())
        print (to_string n)    ; 3
        print s                ; Hello
    }
}
```

Huom: `.add(3)` ja `.add("Hello")` resolvoituvat **eri overloadeihin**; ketjun **seuraava** askel (`finish`) käyttää **edellisen kutsun paluutyyppiä** (`IntAcc` vs `StrAcc`), ei `PolyRoot`:ia.

**Vaatimukset:**

1. **Overload-resoluutio ketjussa** – jokaisessa `call`-linkissä valitaan variantti argumenttityypeillä (`method_variants` / `stdParamMatch`), kuten `proc_send`-overloadissa ([`process_proc_send_overload.rgr`](./tests/fixtures/process_proc_send_overload.rgr)).
2. **Paluutyypin propagointi** – `eval_type_name` päivittyy valitun variantin paluutyypiksi → seuraava `.finish()` lookup oikeaan luokkaan.
3. **Monikielinen codegen** – kielet ilman overloadingia eivät saa tuottaa kahta `add`-metodia samalla nimellä:

| Target | Overloading-tuki | Strategia ketjussa |
|--------|------------------|-------------------|
| JavaScript | ei (yksi nimi per prototyyppi) | `compiledName`-mangling (`add_int`, `add_string`) tai runtime-dispatch |
| Java / C# | kyllä | suora tai mangled riippuen writerista |
| Go | ei | `compiledName` per variantti (jo olemassa `method_variants`) |
| Rust | ei | eri fn-nimet per variantti |
| LLVM | ei | IR:ssä erilliset symbolit + statinen resoluutio compile-time |
| Python | ei | yksi nimi, viimeinen voittaa – **vaatii manglingin** |

4. **Codegen ketjussa** – desugarin jälkeen jokainen `call`-linkki viittaa **valittuun** `RangerAppFunctionDesc`-varianttiin (`compiledName`), ei geneeriseen `add`-nimeen.

**Työ:**

- [ ] Fixture `tests/fixtures/chain_polymorphic_add.rgr` (yllä oleva tai vastaava)
- [ ] `tests/compiler-chain.test.ts`: compile + run + tyyppivirheet (väärä `finish` väärälle haaralle)
- [ ] `cmdCall` / overload-match: receiver-tyyppi sisäkkäisessä ketjussa = edellisen variantin paluutyyppi
- [ ] Varmista `CreateCallExpression` käyttää `fnDesc.compiledName` overload-ketjussa
- [ ] Target-testit vähintään: **ES6**, **Go**, **LLVM** (kieliä ilman overloadingia)
- [ ] Dokumentoi writer-kohtainen strategia taulukkoon (yllä)

**Tiedostot:** `ng_RangerFlowParser.rgr` (`cmdCall`, `stdParamMatch`), `ng_RangerGenericClassWriter.rgr`, `ng_RangerGolangClassWriter.rgr`, `ng_LowIRBuilder.rgr`, `tests/compiler-chain.test.ts`

**Riskit:**
- Ketju jossa overload palauttaa **eri luokan** kuin receiver – tyyppipäättelyn pitää seurata varianttia, ei alkuperäistä `new`-tyyppiä
- Bootstrap: jos logiikka kasvaa, tarvitaan sama patch-kuvio kuin `tryDesugarNewMethodChain`

---

### Vaihe 2c – Operaattoriketjutus (Lang.rgr / “type class” -tyyli)

**Tavoite:** jos operaattori on määritelty `Lang.rgr`:ssä (tai `stdops.rgr`), sitä voi kutsua **ketjumuodossa** receiverin kautta – ja ketjuttaa peräkkäin kuten metodeja.

**Esimerkki:**

```ranger
def str:string "  hello world  "
def part:string (str.substring(3, 7).trim())
; ≡ (trim (substring str 3 7))
; JS: str.substring(3, 7).trim()
```

**Type-class -analogia:**

Rangerissa operaattorit ovat jo nyt **tyyppikohtaisia** (`Lang.rgr`: `substring (text:string start:int end:int)`, eri variantti `charbuffer`:lle jne.). Vaihe 2c tekee tästä eksplisiittisen ketjutuspolun:

| Käsite | Ranger-toteutus |
|--------|-----------------|
| “Type class” | `Lang.rgr` / `stdops.rgr` -operaattoriryhmä (esim. `substring`, `trim`, `strlen`) |
| “Instanssi” | operaattorin variantti, jonka 1. parametri matchaa receiver-tyypin (`string`, `charbuffer`, …) |
| Metodikutsu `recv.op(args)` | desugar → `(op recv args…)` → `stdParamMatch` valitsee variantin |
| Ketju `recv.op1().op2()` | sisäkkäinen operaattoripuu; väliarvon tyyppi seuraavaan resoluutioon |

Eli operaattorit eivät ole luokan jäsenmetodeja, mutta **käyttäytyvät ketjussa kuin tyyppikohtaiset laajennukset** – ilman erillistä `extend`-syntaksia.

**Säännöt:**

1. **Vain tunnetut operaattorit** – `.substring(...)` sallitaan vain jos `substring` löytyy `Lang.rgr`:stä ja receiver-tyyppi matchaa.
2. **Ei varjoa luokan metodia** – jos luokalla on oma `fn substring`, luokan metodi voittaa (tai eksplisiittinen prioriteettisääntö dokumentoidaan).
3. **Desugar** – `recv.op(a, b)` → `call`- tai `oper`-node, jossa `has_operator = true` ja lapset vastaavat prefix-muotoa.
4. **Paluutyyppi** – operaattorin template-paluutyyppi (`cmdSubstring:string` → `string`) propagoidaan ketjussa kuten metodikutsussa.
5. **Sekaketju** – `obj.foo().trim()` yhdistää vaiheen 2 metodiketjun ja 2c operaattoriketjun samassa desugar-passissa.
6. **Codegen** – hyödyntää olemassa olevia `Lang.rgr`-templateja; JS-kohdalla `*` usein jo tuottaa `.substring(...)` -muodon.

**Esimerkkicase (testifixture):**

```ranger
class ChainOperatorSubstring {
    sfn m@(main):void () {
        def str:string "  hello world  "
        def part:string (str.substring(3, 7).trim())
        print part
    }
}
; expect output: "hello"
; expect JS: str.substring(3, 7).trim() tai vastaava
```

**Työ:**

- [ ] Fixture `tests/fixtures/chain_operator_substring.rgr` (+ mahd. `chain_operator_mixed.rgr` metodi + operaattori)
- [ ] `tests/compiler-chain.test.ts`: compile, run, paluutyyppi `string`
- [ ] ChainDesugar / `cmdLocalCall`: tunnista `.op(args)` jossa `op` on Lang-operaattori (ei luokan metodi)
- [ ] Desugar `recv.op(...)` → prefix-operaattorikutsu; aseta `has_operator = true`
- [ ] `stdParamMatch`: receiver-tyyppi ensimmäiseksi argumentiksi; overload-variantit kuten 2b
- [ ] Ketjuta operaattorien väliset väliarvot (substring → string → trim)
- [ ] Virhe: tuntematon `.foo()` ilman operaattoria/metodia; väärät arg-tyypit
- [ ] Dokumentoi suhde `PLAN_STATIC_ANALYSIS.md` / tulevaan trait-tyyppiin

**Tiedostot:** `ng_ChainDesugar.rgr` (tai laajennus `cmdLocalCall`/`tryDesugar`), `ng_parser_std_match.rgr`, `compiler/Lang.rgr`, `ng_LiveCompiler.rgr`, `ng_RangerGenericClassWriter.rgr`

**Riippuvuudet:**
- Voidaan aloittaa yksinkertaisella tapauksella (yksi operaattori, ei overload) ennen 2b:tä
- Täysi sekaketju + polymorfiset operaattorit hyötyvät vaiheista 2b ja 3

**Ei-tavoitteet (2c):**
- Uudet operaattorit vain ketjusyntaksilla ilman `Lang.rgr`-määrittelyä
- Operaattori ilman receiveriä ketjussa (`.map(...)` ilman objektia)

---

### Vaihe 3 – Yhtenäinen ChainDesugar-passi (3–5 pv)

- [ ] Uusi `ng_ChainDesugar.rgr`:
  - Tunnista ketju: peräkkäiset `.method` / `.method(args)` -lapset
  - Tunnista operaattoriketju: `.op` jossa `op` ∈ `Lang.rgr` (vaihe 2c)
  - Rakenna sisäkkäinen `call`- / `oper`-puu (metodi + operaattori + sekamuoto)
  - Korvaa alkuperäinen node
- [ ] Kutsu `LiveCompiler`-putkesta ennen typecheckiä
- [ ] Poista duplikaattilogiikka vähitellen:
  - `ng_RangerFlowParser.fixExpressionAssignmentChains` (deprecated)
  - `cmdLocalCall` ketjuosuus
  - `ng_parser_std_match.rgr` ketjublokki (jos käyttämätön)
- [ ] Säilytä `createChainTarget` vain jos def/assign-polku tarvitsee erikoiskohtelun

### Vaihe 4 – Laajennukset (myöhempi)

- [ ] Property-ketju: `obj.foo().bar` (ei kutsua) → `CreatePropertyGet` ketjutus
- [ ] `this`-palauttava fluent API dokumentointi (`return this`)
- [ ] LLVM/LowIR: ketjutetut kutsut + ownership (väliaikaiset receiver-temporarit, borrow)
- [ ] Rust/Go/Swift writer -varmistus samoilla fixtureilla

### Vaihe 5 – Parser-refaktorointi (valinnainen, pitkä)

- [ ] Postfix `PostfixExpr = Primary { ('.' IDENT ['(' Args ')']) }`
- [ ] Integroi `ng_parser_v2.rgr` tai flow-parserin infix-taulukkoon
- [ ] Yhtenäistä `is_direct_method_call` vs `has_call` vs `chainroot`

---

## Parser-refaktoroinnin vaikutus

Nykyinen `RangerFlowParser` on iso (~5500 riviä) ja ketjutus on **walk-aikainen kikka**, ei syntaksitason ominaisuus. Refaktorointi koskee:

| Alue | Muutos |
|------|--------|
| `WalkNode` / `cmdLocalCall` | Ketjutus pois → delegoidaan desugar-passille |
| `fixExpressionAssignmentChains` | Poistetaan kun desugar kattaa saman |
| `CodeNode` flags | `is_part_of_chain`, `chainroot` tag deprekoitu |
| `ng_parser_std_match.rgr` | Ketjublokki pois tai delegointi |
| Testit | Uusi `compiler-chain.test.ts` pakolliseksi CI:hin |

**Riski:** regressiot monimutkaisissa lauseissa (`obj = a.foo().bar()`, lambda + ketju). Siksi golden testit ensin.

---

## Kohdekohtainen codegen

| Target | Ketjutettu `a.b().c()` |
|--------|-------------------------|
| JavaScript | `a.b().c()` – suora |
| LLVM | receiver-temp per välikutsu jos sivuvaikutus; borrow jos palauttaa `this` |
| Rust | omistajuus: `self` vs `&mut self` – fluent API vaatii `&mut self` tai owned receiver |
| Java/C# | suora |

LLVM-erityishuomio: `obj.add(x)` joka palauttaa `this` aliasoi saman objektin – sama borrow-analyysi kuin [PLAN_LLVM_MEMORY.md](./PLAN_LLVM_MEMORY.md).

---

## Testisuunnitelma

```ranger
; chain_fluent_builder.rgr
class Acc {
    def v:int 0
    fn add:Acc (n:int) { v = (+ v n); return this }
    fn get:int () { return v }
}
class Main {
    sfn run:int () {
        return (new Acc().add(1).add(2).add(3).get())
    }
}
; expect JS: new Acc(); ... .add(1).add(2).add(3).get()
; expect return 6
```

Testaa myös:
- pelkkä statement-ketju (ei sijoitus)
- ketju `def`-lauseessa
- ketju funktion argumenttina
- virhe: keskeneräinen ketju tyhjällä receiverillä

**Polymorfinen ketju (vaihe 2b):**

```ranger
; chain_polymorphic_add.rgr – odotettu käyttäytyminen
def n:int (new PolyRoot().add(3).finish())       ; IntAcc-haara
def s:string (new PolyRoot().add("Hello").finish()) ; StrAcc-haara
; JS/Go/LLVM: eri mangled-nimet per add-variantti, finish oikeaan tyyppiin
```

**Operaattoriketju (vaihe 2c):**

```ranger
; chain_operator_substring.rgr
def part:string (str.substring(3, 7).trim())
; ≡ (trim (substring str 3 7)); receiver-tyyppi → oikea Lang.rgr-variantti
```

---

## Prioriteetti ja aikataulu

| Vaihe | Hyöty | Työmäärä |
|-------|-------|----------|
| 0 Testit | korkea (estää regressiot) | pieni ✅ |
| 1 Codegen-korjaus | **kriittinen** | pieni–keski ✅ |
| 2 Tyyppipäättely | korkea | pieni ✅ |
| **2b Polymorfinen ketjutus** | **korkea – seuraava** | keski |
| **2c Operaattoriketjutus** | korkea (Lang.rgr / type-class -UX) | keski |
| 3 Desugar-passi | korkea (ylläpidettävyys) | keski |
| 4–5 Laajennukset | keskitaso | suuri |

**Saavutettu milestone:** vaiheet 0+1+2 → `new Acc().add(1).add(2).get()` kääntyy oikein JS:ään, paluutyyppi `int`.

**Seuraava milestone:** vaihe 2b → `new PolyRoot().add(3).finish()` ja `.add("Hello").finish()` resolvoituvat oikein + kääntyvät Go/LLVM:ään ilman overloading-tukea.

**Milestone sen jälkeen:** vaihe 2c → `str.substring(3, 7).trim()` toimii ketjuna ja käyttää `Lang.rgr`-operaattoreita type-class-tyyppisesti (receiver-tyyppi valitsee instanssin).

---

## Yhteenveto

Rangerissa **method chaining ei ole uusi idea** – se on aloitettu mutta jäänyt keskeneräiseksi. Ongelma ei ole niinkään syntaksin puute kuin **hajautettu desugar + rikkinäinen codegen ja tyyppipäättely**.

Suosittu polku:
1. ~~Golden testit~~ ✅
2. ~~Korjaa ketjumuunnos + tyyppipäättely~~ ✅
3. **Polymorfinen overload ketjussa + monikielinen codegen (2b)** ← seuraavaksi
4. **Operaattoriketjutus** – `str.substring(3,4)` käyttäen `Lang.rgr`-operaattoreita kuin type classeja (2c)
5. Yhtenäistä `ng_ChainDesugar`-passiin (3) – metodi + operaattori samaan passiin
6. Parser-refaktorointi vasta kun perus fluent API toimii luotettavasti
