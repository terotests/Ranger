# WASM pluginit ja makrot � visio

Kyll�, itse asiassa **pluginit ja makrot ovat paljon kiinnostavampi k�ytt�kohde WASM:lle kuin pelkk� "viel� yksi target"**.

Jos katson Rangerin nykyist� arkkitehtuuria, n�kisin WASM:n ennen kaikkea n�in:

```text
Ranger Compiler
    ?
 Compiler API
    ?
 WASM plugin
```

eik� niink��n:

```text
Ranger
   ?
 WASM
```

---

## Ongelma jonka WASM ratkaisee

Jos annat k�ytt�j�n kirjoittaa k��nt�j�n pluginin:

```ranger
plugin MyOptimization {
}
```

ja ajat sit� natiivina:

```text
dlopen()
eval()
reflection()
```

plugin voi:

* kaataa k��nt�j�n
* vuotaa muistia
* j��d� ikuiseen silmukkaan
* lukea tiedostoja
* tehd� mit� tahansa

WASM:ssa saat automaattisesti sandboxin.

Plugin saa vain ne API:t jotka annat sille.

---

## AST-makrot WASM:na

Voisit m��ritell�:

```ranger
plugin RemoveUnusedVars {
    fn transform(node:ASTNode):ASTNode {
    }
}
```

K��nt�j�:

```text
parse
 ?
AST
 ?
call wasm plugin
 ?
modified AST
 ?
codegen
```

T�m� muistuttaa v�h�n Rustin procedural macroja, mutta turvallisemmin.

---

## Optimointipluginien markkinapaikka

T�m� voisi olla aika uniikki ominaisuus.

Esimerkiksi:

```text
ranger-opt-inline.wasm
ranger-opt-simd.wasm
ranger-opt-tailcall.wasm
```

ja k�ytt�j� valitsee:

```bash
ranger build \
  --plugin inline.wasm \
  --plugin simd.wasm
```

---

## Makrot jotka generoivat koodia

Esim.

```ranger
@json
class User {
   name:string
   age:int
}
```

Makro:

```text
json_macro.wasm
```

saa AST:n:

```text
Class(User)
```

ja palauttaa:

```text
Class(User)
serialize()
deserialize()
```

---

## K��nt�j�n sis�inen DSL

Voisit tehd� jopa:

```ranger
compiletime {
   ...
}
```

joka k��nnet��n WASM:ksi.

K��nt�j�:

```text
1. compile compiletime block
2. produce wasm
3. execute wasm
4. read result
5. continue compilation
```

T�m� on hyvin samanlainen idea kuin Zig:n `comptime`.

---

## Erityisen kiinnostava Rangerille

Koska Ranger osaa generoida monia kieli�, plugin voisi olla target-kohtainen.

```text
AST
 ?
Java optimizer
 ?
JS optimizer
 ?
Go optimizer
 ?
CPP optimizer
```

Kaikki plugineina.

K��nt�j�n ydint� ei tarvitse muuttaa.

---

## Yksi todella mielenkiintoinen idea

Sen sijaan ett� pluginit muokkaavat AST:ta, ne voisivat muokata tulevaa Ranger IR:��.

```text
AST
 ?
Ranger IR
 ?
WASM plugin
 ?
optimized Ranger IR
 ?
LLVM
 ?
WASM/native
```

T�m� olisi paljon vakaampi rajapinta.

AST muuttuu helposti kielen kehittyess�.

IR pysyy yleens� vakaampana.

LLVM:n menestys perustuu pitk�lti juuri t�h�n ajatukseen.

---

## Ehdotettu etenemisj�rjestys

Jos olisin rakentamassa Rangeria eteenp�in, pit�isin jopa mahdollisena ett� **ensimm�inen WASM-k�ytt�kohde ei olisi koodigenerointi vaan k��nt�j�n laajennukset**:

```text
Phase 1:
  WASM plugins

Phase 2:
  WASM macros

Phase 3:
  Ranger IR plugins

Phase 4:
  WASM target
```

T�m� voisi tuoda Rangeriin jotain melko omaleimaista: turvallisesti ajettavat, eri kielitargeteista riippumattomat k��nt�j�laajennukset. Se on ominaisuus, jota monilla kielill� ei ole kovin elegantisti ratkaistu.

---

## Liittyv�t dokumentit

* [PLAN_WASM_BACKEND.md](./PLAN_WASM_BACKEND.md) — WASM/WAT-pipelinen nykytila
* [PLUGINS_REVIEW.md](./PLUGINS_REVIEW.md) � nykyinen JavaScript-pohjainen plugin-arkkitehtuuri
* [ai/ADDING_NEW_LANGUAGE.md](./ai/ADDING_NEW_LANGUAGE.md) � backend-integraatio
* [compiler/ng_LowIR.rgr](./compiler/ng_LowIR.rgr) � Low IR (mahdollinen plugin-rajapinta Phase 3:ssa)
