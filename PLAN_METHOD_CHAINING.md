# Ranger – method call chaining (fluent API)

Tämä dokumentti kuvaa suunnitelman oliopohjaiseen method call chaining -syntaksiin tyyliin `obj.add(x).add(y).build()`. Ranger on käytännössä oliopohjainen; fluent builder -API:t ja parser-ketjut hyötyisivät tästä merkittävästi.

Katso myös [compiler/test_chain.rgr](./compiler/test_chain.rgr) (vanha kokeilu) ja [PLAN_STATIC_ANALYSIS.md](./PLAN_STATIC_ANALYSIS.md).

## Nykytila (2026-06-08)

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

**Parsinta (osittain):** lause `new Builder().add(1).add(2)` käännetään ja tyypitetään `Builder`-tyyppiseksi muuttujaksi.

**Koodigenerointi (rikki):** sama lause tuottaa JS:ään vain `const b = new Builder()` – `.add()`-kutsut **puuttuvat kokonaan**.

**Tyyppipäättely (rikki):** `new Builder().add(1).add(2).add(3).sum()` raportoi `Builder <> int` – ketjun **viimeisen** kutsun paluutyyppi ei propagoidu.

**Syntaksirajoitukset:**
- Vaatii usein eksplisiittisen `new` (`Builder()` ilman `new` ei toimi konstruktorikutsuna).
- Ketjutus perustuu erillisiin `.method` -lapsinodeihin (ei yhtenäistä postfix-parseria).
- Vanha `test_chain.rgr` ei käänny nykyisellä kääntäjällä ilman virheitä.

### Juurisyyt

1. **Ketjumuunnos tapahtuu liian myöhään ja epätasaisesti** – eri poluissa (`cmdLocalCall`, `fixExpressionAssignmentChains`, std_match) ilman yhteistä AST-muotoa.
2. **`is_part_of_chain` ohittaa nodet** parserissa ja LiveCompilerissa, mutta `chainroot`-noden `has_call` / `flow_done` -tila ei aina synkassa codegenin kanssa.
3. **Tyyppipäättely ei käy rekursiivisesti** sisäkkäisten `call`-nodien läpi ketjun loppuun asti.
4. **Ei testejä** – `test_chain.rgr` on manuaalinen luonnos, ei CI-fixture.

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
```

**Ei-tavoitteet (v1):**
- Operaattoriketjutus (`a + b.map(...)`) – erillinen feature
- Optional chaining (`obj?.foo()`) – myöhempi
- `Builder()` ilman `new` – erillinen syntaksisokeri

---

## Arkkitehtuuriehdotus

### Ydinidea: yksi desugar-passi, yksi AST-muoto

```
Lähde:  recv.method1(a).method2(b).method3()
                ↓
Parse:  (nykyinen infix/call-rakenne säilyy toistaiseksi)
                ↓
Desugar (uusi passi tai yhdistetty):
        call(
          call(
            call(recv, method1, (a)),
            method2, (b)),
          method3, ())
                ↓
Typecheck: eval_type = method3:n paluutyyppi
                ↓
Codegen:  recv.method1(a).method2(b).method3()  (tai vastaava per target)
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

### Vaihe 0 – Diagnoosi ja golden testit (1–2 pv)

- [ ] Fixture `tests/fixtures/chain_fluent_builder.rgr` (builder + sum/build)
- [ ] Fixture `tests/fixtures/chain_new_method.rgr` (`new C().m().n()`)
- [ ] Fixture `tests/fixtures/chain_stmt.rgr` (pelkkä lauseketju)
- [ ] `tests/compiler-chain.test.ts`: JS-output snapshot / sisältöassertiot
- [ ] Dokumentoi nykyinen rikkinäinen käyttäytyminen testeillä (expect fail → fix → pass)

### Vaihe 1 – Korjaa codegen polku (2–3 pv)

**Ongelma:** `is_part_of_chain` skip + `chainroot` ei synny `has_call`-nodena oikein.

**Työ:**
1. Trace `new MyClass().foo()` AST ennen/jälkeen desugarin (debug-print tai test helper)
2. Varmista että `LiveCompiler.WalkNode` kutsuu `CreateCallExpression` ulommalle `call`-nodelle
3. Korjaa `fixExpressionAssignmentChains` / `cmdLocalCall` niin että tulosnode on aina `has_call = true`
4. Poista tarpeeton `is_part_of_chain` skip codegen-polusta kun desugar on valmis

**Tiedostot:** `ng_RangerFlowParser.rgr`, `ng_LiveCompiler.rgr`, `ng_RangerGenericClassWriter.rgr`

### Vaihe 2 – Tyyppipäättely ketjun läpi (1–2 pv)

**Ongelma:** `new Builder().add(1).sum()` tyypitetään `Builder`:ksi, ei `int`:iksi.

**Työ:**
1. Kun `call`-node on ketjutettu (receiver on toinen `call`), aseta parent.eval_type = tämän kutsun paluutyyppi
2. `cmdLocalCall` / method lookup: käytä receiverin `eval_type_name` sisäkkäisille kutsuille
3. Testaa `def r:int (new Builder().add(1).add(2).sum())`

**Tiedostot:** `ng_RangerFlowParser.rgr` (eval in walk), mahdollisesti `ng_StaticAnalysis.rgr`

### Vaihe 3 – Yhtenäinen ChainDesugar-passi (3–5 pv)

- [ ] Uusi `ng_ChainDesugar.rgr`:
  - Tunnista ketju: peräkkäiset `.method` / `.method(args)` -lapset
  - Rakenna sisäkkäinen `call`-puu
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

---

## Prioriteetti ja aikataulu

| Vaihe | Hyöty | Työmäärä |
|-------|-------|----------|
| 0 Testit | korkea (estää regressiot) | pieni |
| 1 Codegen-korjaus | **kriittinen** – ilman tätä feature on käyttökelvoton | pieni–keski |
| 2 Tyyppipäättely | korkea | pieni |
| 3 Desugar-passi | korkea (ylläpidettävyys) | keski |
| 4–5 Laajennukset | keskitaso | suuri |

**Ensimmäinen käyttökelpoinen milestone:** vaiheet 0+1+2 → `new Builder().add(1).add(2).sum()` kääntyy oikein JS:ään ja LLVM:ään.

---

## Yhteenveto

Rangerissa **method chaining ei ole uusi idea** – se on aloitettu mutta jäänyt keskeneräiseksi. Ongelma ei ole niinkään syntaksin puute kuin **hajautettu desugar + rikkinäinen codegen ja tyyppipäättely**.

Suosittu polku:
1. Golden testit
2. Korjaa olemassa oleva ketjumuunnos emittoimaan oikea `call`-puu
3. Yhtenäistä `ng_ChainDesugar`-passiin
4. Parser-refaktorointi vasta kun perus fluent API toimii luotettavasti
