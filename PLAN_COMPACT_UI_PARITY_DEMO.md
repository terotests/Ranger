# PLAN — COMPACT-sisältö `gallery/realtrainer`-demoon

Status: `P0–P2 tehty` · 2026-09-03

**Päätös:** RealTrainerin UI ajetaan Rangerin EVG-komponenteilla. Reactia tai käsin kirjoitettua
JavaScriptiä ei jää. Työ ei ole uuden moduulin rakentamista: **`gallery/realtrainer/` on jo
olemassa** ja toimii — siitä puuttuu vain oikea sisältö. Tämä suunnitelma kuvaa sen delta:
keksitty data korvataan parsitulla COMPACT-dokumentilla, ja yhdestä kovakoodatusta liikekortista
kasvatetaan rivikirjasto.

Benchmarkkina `realtrainer-compact`-kirjaston TS-toteutus (testiorakkeli, ei koodilähde).
Ei Google Cloud -integraatiota — UI-logiikkaa ja simuloituja backend-kutsuja vain.

---

## 1. Mitä on jo olemassa

`gallery/realtrainer/` (1 428 riviä Rangeria + teema + kaksi porttia):

- **Neljä näkymää** — loader, sign-in, dashboard, session — `gallery/ui`:n kahdeksalla
  kontrollerilla (`ProgressCtl`, `CheckboxCtl`, `CollapsibleCtl`, `TabsCtl`, `TableCtl`,
  `ToggleCtl`, `AccordionCtl`, `RadioGroupCtl`), piirrettynä EVG:n WebGL-painterilla.
- **Kello on sovelluksessa**: `tick(dtMs)` on koko animaatio, joten headless-ajo ja selain ajavat
  samaa sovellusta. Juuri se mitä COMPACT-ajastin tarvitsee.
- **Kaksi porttia**: `rt:check` lukee display listin Nodessa ilman selainta (CI), `rt:frame` lukee
  framebufferin Chromiumissa ja kirjoittaa `web/shots/`-kuvat.
- **Teema tyylitiedostona**: `web/realtrainer.css` pukee jokaisen `ui-*`-luokan; kontrolleri
  kirjoittaa luokkanimiä eikä koskaan väriä.
- **`adopt()`** kopioi kontrollerin `rows()`-semantiikan elementtipuuhun — kirjaston ja sovelluksen
  raja on siis jo ratkaistu.

Skriptit: `rt:build`, `rt:check`, `rt:page`, `rt:frame`, `rt:shots`, `rt:web`.

### 1.1 Mikä on keksittyä ja korvataan

| Nyt | Missä | Korvautuu |
|-----|-------|-----------|
| `def sets:int 3` / `reps:int 5` / `weight:int 40` — **yksi** liike kolmena int-kenttänä | `RealTrainerDemo` kentät | `[CompactRow]` parserilta |
| `planLine()` — merkkijonoliimaus `"3 × 5 @ 40kg"` | rivi 768 | `CompactStatBuilder` → `[StatPart]` |
| `"1. Rinnalleveto"`, `"Kevyt salitreeni"` | `moveCard()`, `workout()` | parsitun dokumentin sisältö |
| `timerFullMs:double 60000.0`, `timerLeftMs` | ajastintila | `WorkoutTimingController`in portti (segmentit, bilateraalisuus, mitatut kestot) |
| goals-taulukon ja plans-akkordionin rivit | `goalsTable()`, `drillsPanel()` | parsitut dokumentit |

`moveCard()` on tänään yksi kovakoodattu liikekortti. Siitä tulee **rivikirjaston ensimmäinen
jäsen**, ja se on työn ydin: 31 rivifamiliaa `CompactRow`-shapesta EVG-elementeiksi.

---

## 2. Varmistettu: shape kantaa 31 familiaa

Ajettu tässä checkoutissa (`ranger-compiler v3.3.1`), ei arvio:

```ranger
shape CompactRow {
    case Section  { def name:string "" }
    case Text     { def text:string "" }
    case Exercise { def name:string ""  def sets:int 0  def reps:int 0
                    def weightKg:double 0.0  def hasWeight:boolean false }
}
```

`match` builderissa → `[StatPart]`, ja `for rows r:CompactRow i` toimii. Ajo:

```
Paaosa[meta]
3x5[spec] 90kg[weight]
hyva fiilis[meta]
```

Lowerointi per target — jokainen case saa **oman luokkansa**, ei leveää tietuetta:

| Target | Esitys |
|--------|--------|
| ES6 / TypeScript | `class CompactRow_Exercise` + `__rg_kind`-tagi |
| Kotlin | `sealed interface union_CompactRow`, luokat toteuttavat sen |
| Swift 6 | `enum union_CompactRow { case CompactRow_Exercise(...) }` |

`match` on kääntäjän tarkistama kattavuudeltaan. ES6-esitys on sama tagattu muoto kuin TS-kirjaston
oma `CompactRow`-unioni `type`-kentällä, joten L0-vertailu (§4) on suora.

> `RANGER_STYLE_REVIEW.md` §4 (2026-07-07) väittää ettei Rangerissa ole sum-tyyppejä. Se on
> vanhentunut. Älä käytä `SliceParsedValue`-mallia (21 optional-kenttää unionin korvikkeena)
> äläkä luokkaperintöä (`PLAN_SHAPES.md`: perintö hajoaa Rust-targetilla, `RUST_ISSUES.md:567`).

---

## 3. Parseri — tehty

`compact_parser_v1.rgr` -lähde on yksityisessä repossa `realtrainer/parser-ranger-v1/src/`.
Julkinen `realtrainer-compact` vendoroi vain generoidun TypeScriptin (8 494 r), ei `.rgr`-lähdettä.
`rt:check` ajaa CI:ssä, joten sisarcheckoutiin nojaava sync olisi rikkonut portin.

**Ratkaisu: vendorointi + sync-skripti.** `gallery/realtrainer/parser/` sisältää entry-tiedoston
**transitiivisen import-sulkeuman ja ei mitään muuta: 46 tiedostoa, 8 819 riviä.** Lähdepuu
kantaa myös NG-detektoriraiteen, JSON-adapterit ja testiajurit — yhteensä 122 tiedostoa ja
17 768 riviä — joista tämä demo ei käännä mitään. Sulkeuma lasketaan joka ajolla, joten kopio
kutistuu ja kasvaa sen mukaan mitä demo oikeasti käyttää.

```bash
npm run rt:parser:sync     # kopioi sisarcheckoutista
npm run rt:parser:check    # kaatuu jos kopio on vanhentunut  (CI)
```

Skripti poistaa myös orvot: sulkeumasta pudonnut tiedosto lähtee kopiosta, tai demo kääntäisi
jotain mitä parserissa ei enää ole. Lisenssi: vendoroidut tiedostot ovat GPL-3.0-or-later ja
pysyvät sellaisina (`parser/README.md`); `gallery/` on AGPL-3.0-or-later, ja GPLv3-lähteen
käyttö AGPLv3-teoksessa on sallittu suunta (AGPL §13).

Tavoite ennallaan: `.rgr`-lähde julkaistaan `realtrainer-compact`iin, jolloin sync osoittaa
julkiseen pakettiin eikä yksityiseen repoon.

## 4. Benchmark ja parity

Orakkelina TS-kirjasto, joka **ei ole osa buildia**: se ajetaan erikseen ja tulos talletetaan
JSON-fixtureiksi, jotta Ranger-puoli ei riipu Nodesta ajossa.

### L0 — DTO- ja muotoiluparity (puhdas data, ei selainta)

Sama `.compact` molempien läpi, rakenteet vertaillaan:

- `parsedRowMapping.ts` → `CompactRow[]`  ⟷  `CompactRowMapper.rgr` → shape-arvot
- `formatters.ts` → `CompactStatPart[]`  ⟷  `CompactStatBuilder.rgr` → `[StatPart]`

`CompactStatPart` on `{ text, tone, kind }` ja Ranger-shape lowertaa samaan tagattuun muotoon, joten
vertailu on suora deep-equal. Tämä nappaa valtaosan puutteista — yksiköt, rangeet (`2-3x15-20`),
bilateraalisuus (`2x10+10`), RM, mitatut kestot (`45s, 45s`), palautus (`/2-3min`, `/hölkkä`), pace
(`@3:50-3:40/km`), HR (`@120-150bpm`) — jokaisella committilla. **Portin tärkein mittari.**

### L1 — ajastinparity (simuloitu kello)

`WorkoutTimingController`in olemassa olevat yksikkötestit ajetaan Ranger-portin läpi:
`VirtualClock.advanceBy(n)` ⟷ demon oma `tick(dtMs)`. Tilasnapshotit ja tapahtumajonot askel
askeleelta. Demon kello on jo sovelluksessa, joten tämä istuu suoraan `rt:check`-porttiin.

### L2 — näkymäparity (`rt:check` + `rt:frame`)

Olemassa olevat portit laajennetaan: `web/loader-check.mjs` lukee display lististä että jokainen
case-korpuksen rivi tuottaa odotetut tekstit ja a11y-solmut; `web/frame-check.mjs` klikkaa
a11y-puun ilmoittamia suorakulmioita ja kirjoittaa kuvat. Rivikomponenteille ei ole Radix-vastinetta,
joten orakkelina on `ui/react`:n renderöimä DOM samassa kenttämuodossa.

**Pikseliparityä ei tavoitella** — layout-moottorit eroavat tarkoituksella; vertailtava on se, mitä
käyttäjä voi havaita.

### 4.1 Case-korpus ja kattavuusraportti

`fixtures/cases/` — yksi `.compact`-katkelma per `COMPACT_FEATURE_MATRIX.md`:n solu + manifesti:

```json
{ "id": "exercise-set-range-rep-range", "family": "exercise",
  "dimension": "range", "compact": "Squat|2-3x15-20@60kg", "matrix": "5.2" }
```

Raportti lukee L0–L2-liput ja kirjoittaa matriisin coverage-taulukon uusiksi: `❓` → `✅ / 🟡 / ❌`.
Taulukossa on 31 riviä × 7 saraketta pelkkiä `❓`-merkkejä; tämä tekee siitä elävän tulostaulun.
Prioriteetti matriisin §5.5 mukaan: `exercise` → `move` → `interval` → `pyramid` → `split`, sitten
kevyet rivit.

Korpuksen lähteet: `realtrainer-compact/MONSTER.compact`, `MINI_TRAINING_PLAN.compact`, `data/`,
`examples/`, ja `realtrainer/training_data/*.compact` (9 tiedostoa).

---

## 5. Simuloitu backend

`realtrainer-compact` ei sisällä backendiä lainkaan, joten "ei pilveä" on lähtötila. Demo tarvitsee
silti kutsupinnan, jotta lataus-, tallennus- ja virhetilat näkyvät. Rangerissa `RtBackendSim`,
joka lukee demon omaa kelloa:

| Operaatio | Simulaatio |
|-----------|-----------|
| `listDocuments()` | fixture-hakemisto, 120–300 ms simuloitua viivettä |
| `loadDocument(id)` | teksti fixtureista, viive, valinnainen 404 |
| `saveDocument(id compact)` | viive, palauttaa version |
| `streamAssist(prompt)` | striimaa chunkkeina valmiin COMPACT-vastauksen |
| virhe-injektio | demon nappi → virhetilat testattavissa |

Sama kello kuin L1:ssä, joten viiveet ovat deterministisiä `rt:check`issä. Loader-näkymä on jo
olemassa — se saa vihdoin oikean odotuksen odotettavakseen.

---

## 6. Vaiheistus

| Vaihe | Sisältö | Valmis kun |
|-------|---------|-----------|
| ~~**P0 — parseri sisään**~~ **tehty** | Vendoroitu parseri + `rt:parser:sync`/`rt:parser:check`; `shape CompactRow` (section, text, exercise); `CompactRowMapper`, `CompactStatBuilder`, `StatPart`; `rt:compact`-portti | `npm run rt:compact` vihreä: 13 tarkistusta, `3x5@90kg` → `3x5` + `x90kg` |
| ~~**P1 — sisältö tilalle**~~ **tehty** | `sets/reps/weight` → `[CompactRow]`; `planLine()` → `[StatPart]`, yksi elementti per osa; `moveCard()` renderöi parsitun rivin; mitattu rivi piilottaa stepperit | `rt:check` ja `rt:frame` vihreät, kuvat päivitetty |
| ~~**P2 — L0 core**~~ **tehty** | `shape` sai `Move`, `Pyramid` ja `Split` -caset; muotoilijat portattu TS-kirjastosta; 22 casen korpus, `oracle/record.mjs` + committoitu `expected.json`, `rt:l0` gallery-suitessa | **21/21 vertailukelpoista casea täsmää osa osalta**; `interval` merkitty vertaamattomaksi (ei renderöijää referenssikirjastossa) |
| **P3 — rivikirjasto** *(kesken)* | Tehty: 11 rivityyppiä shapessa ja **jokainen matriisin familia päätyy johonkin niistä** — 14 life-familiaa muuttuvat tekstiriviksi kuten referenssissä (`fallbackTextForEntry` portattuna); `Text` piirtää life-labelin ja numerot omina osinaan; tags/emojis/derived suodatettu pois; korpus **53 casea, kaikki täsmäävät**; viides näkymä `document` piirtää koko dokumentin familia kerrallaan. Jäljellä: `Circuit`, vieritys pitkälle dokumentille | MONSTER.compact renderöityy kokonaan |
| **P4 — ajastin** | `WorkoutTimingController` → Ranger; dial lukee segmenttejä; L1 | L1 vihreä |
| **P5 — vuorovaikutus** | Rivin muokkaus (`InputCtl`, `NumberCtl`, `StepperCtl`), `RtBackendSim`, L2-tarkistukset | edit → save → uudelleenlataus säilyy |
| **P6 — kattavuus** | Kattavuusraportti kirjoittaa `COMPACT_FEATURE_MATRIX.md`:n | ei `❓`-soluja |
| **P7 — natiivi** | Kotlin- ja Swift-käännös; `gallery/ui/android` ja `/ios` -hostien savutesti | sama lähde ajaa mobiilissa, nolla JS |

Jokainen vaihe pitää `rt:check`in ja `rt:frame`in vihreänä; screenshotit päivitetään `rt:shots`illa,
jolloin README:n kuvat eivät ajaudu erilleen siitä mitä sovellus piirtää.

---

## 6.1 Mitä P0 löysi

**Shape-casen luokkatyyppinen kenttä saapuu optionaalina.** `case Exercise { def spec:ExerciseSpec }`
sitoutuu `match`issa optionaaliksi, joten se on `unwrap`attava ennen käyttöä — eikä
`(unwrap ex.spec).name` kelpaa `return`in argumentiksi ilman omaa sidontaa. Ei este, mutta se
kannattaa tietää ennen kuin kirjoittaa 31 casea.

**`!` ei toimi jäsenlausekkeella.** `if (!e.hasSets)` ei käänny (`WriteVREF -> Undefined variable
!e`); `gallery/ui`:n idiomi on `if (e.hasSets == false)`. `!null?` toimii, koska se on oma
operaattorinsa.

**Mitatut kestot olivat AST:ssä JSON-merkkijonoja — korjattu.**
`ExerciseNode.measuredDurationJsonList:[string]` → `measuredDurations:[MeasuredDurationNode]`
(`RANGER_STYLE_REVIEW.md`:n havainto 2 sille solmuperheelle jota ei ollut vielä käyty läpi).
Tuotettu JSON on tavulleen sama — todennettu parsimalla `MONSTER.compact`,
`MINI_TRAINING_PLAN.compact` ja `sample.compact` vanhalla ja uudella parserilla ja vertaamalla
`DocumentNode.toJSONString()`. `45s, 45s` renderöityy nyt suoraan luvuista. Korjaus tehtiin
upstream-lähteeseen ja synkattiin; se odottaa vielä pushia yksityiseen repoon, ja on siihen asti
kirjattuna `gallery/realtrainer/PATCHES.md`:hen ja diffinä `patches/`-hakemistoon.

`partJsonList:[string]` on yhä merkkijonoja — sama korjaus, eri solmuperhe, ja se odottaa
kunnes jokin näkymä tarvitsee sitä. Samoin `MoveNode`:n ja `PyramidSetNode`:n raa'at
numeromerkkijonot (`distanceValue:string`, `durationValueRaw`, `weightValueRaw`): P2:n mapperi
parsii ne kerran sisääntulossa, mutta oikea paikka on solmu.

**L0 mittaa portin, ei parseria.** Korpus paljasti kaksi matriisin riviä jotka parseri pudottaa
(`/2-3min` → `recovery: null`, `3xmax` → `reps: null`). Molemmat puolet ovat yhtä mieltä, koska
molemmat kuluttavat samaa parseria — gapit on kirjattu `PATCHES.md`:hen, eikä niitä korjattu
demossa: ne kuuluvat parserin omaan testisuiteen.

**`rt:build` oli rikki ennestään.** `ProgressCtl.value` ja `maxValue` ovat `double`, ja demo
sijoitti niihin int-literaaleja (`bar.maxValue = 100`) — kuusi sijoitusta, 12 käännösvirhettä,
eli `rt:check` oli punainen ennen tätä työtä. Korjattu `100.0`-literaaleiksi ja
`(int2double doneMoves)`:ksi; portti on taas vihreä.

**Koko ketju kääntyy natiiville jo nyt.** `CompactRows.rgr` — vendoroitu parseri mukaan lukien —
kääntyy `-l=kotlin` ja `-l=swift6` puhtaasti. P7 ei siis ole tuntematon, vaan hostien kytkentä.

## 7. Riskit

| Riski | Vaikutus | Torjunta |
|-------|----------|----------|
| ~~Parserin lähde on yksityisessä repossa~~ | — | Ratkaistu §3:ssa: sulkeuma (46 tiedostoa) vendoroitu, sync-skripti estää ajautumisen |
| Rivikirjasto on kokonaan uutta koodia | suurin yksittäinen työmäärä | L0 ensin: kun muotoilu on Rangerissa ja mitattu, EVG-renderöijä on mekaaninen |
| `WorkoutTimingController` on 940 riviä tilakonetta | työläs, virhealtis | vasta P4; olemassa olevat testit ovat spesifikaatio. Kirjaston oma `controller/PLAN.md` merkitsee `ActiveDurationTimer.tsx`:n (721 r) korvattavaksi — älä porttaa sen sisäistä tilaa |
| 31 familiaa on iso shape | käännösaika, kääntäjän rajat | kasvatetaan familia kerrallaan; pieni shape on jo todettu toimivaksi (§2) |
| Teksti-intensiivinen UI EVG:llä | rivien mitoitus ja katkaisu | `EVGText`, `EVGTextFit`, `EVGTextMeasurer` ovat olemassa; P1 mittaa yhden rivin ennen kirjastoa |
| Ei Radix-vastinetta rivikomponenteille | L2:lta puuttuu orakkeli | orakkelina `ui/react`:n DOM samassa kenttämuodossa |
| AGPL (`gallery/`) vs GPL (`realtrainer-compact`) | lisenssiepäselvyys | yhteensopiva suunta (AGPL §13); vendoroitu parseri saa oman merkinnän |

---

## 8. Seuraava askel — P3

Ajettavissa nyt: `rt:compact` (18 tarkistusta), `rt:l0` (21 casea), `rt:check`, `rt:frame`.

P3 on rivikirjasto: loput familiat EVG-renderöijinä ja pitkä dokumentti `ScrollAreaCtl`illa,
niin että `MONSTER.compact` renderöityy kokonaan. Konkreettinen järjestys:

1. Laajenna korpusta matriisin §5.2–5.4 lopuilla soluilla ja aja `rt:l0:record` — puuttuvat
   familiat näkyvät heti vertaamattomina.
2. Lisää `shape`en `Duration`, `Interval`, `Circuit` ja kevyet rivit; `match` vaatii käden
   jokaiselle, joten mitään ei voi unohtaa.
3. Session-näkymä listaksi: `Section`-rivit väliotsikoiksi ja `ScrollAreaCtl` ympärille, kun
   dokumentti ei enää mahdu ruudulle.
