# PLAN — COMPACT-sisältö `gallery/realtrainer`-demoon

Status: `suunnitelma` · 2026-09-03

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

## 3. Parserin sijainti — ainoa este

`compact_parser_v1.rgr` -lähde on **122 tiedostoa, 17 768 riviä**, yksityisessä repossa
`realtrainer/parser-ranger-v1/src/`. Julkinen `realtrainer-compact` vendoroi vain generoidun
TypeScriptin (`src/parser-ranger/compact_parser_v1.ts`, 8 494 r), ei `.rgr`-lähdettä.

Vaihtoehdot:

1. **Sync-skripti sisarcheckoutista** — `gallery/realtrainer/scripts/sync-parser.mjs`, kaava
   `realtrainer-compact/scripts/sync-parser-from-ranger-v1.mjs`:stä. Ei kopiota
   versionhallinnassa; demo ei käänny ilman yksityistä checkoutia.
2. **Vendorointi** `gallery/realtrainer/parser/`:iin + sync-skripti ajautumisen estoon. Demo
   kääntyy itsenäisesti ja CI toimii; 17,7k riviä kopiota ylläpidettävänä.
3. **Julkaisu** `realtrainer-compact`iin `.rgr`-lähteenä — se on jo sen paketin parseribackend,
   joten lähde kuuluisi sinne muutenkin.

**Suositus: (2) nyt, (3) tavoitteena.** `rt:check` ajaa CI:ssä, joten demo ei voi riippua
yksityisestä checkoutista — vaihtoehto (1) rikkoisi portin. Vendoroitu kopio merkitään omalla
lisenssimerkinnällään: `gallery/` on AGPL-3.0-or-later, `realtrainer-compact` GPL-3.0-or-later,
ja GPLv3-lähteen käyttö AGPLv3-projektissa on sallittu suunta (AGPL §13).

---

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
| **P0 — parseri sisään** | §3:n ratkaisu; `gallery/realtrainer/parser/` + `rt:parser:sync`; `shape CompactRow` + `exercise`-familia; `CompactRowMapper` ja `CompactStatBuilder` | `rt:check` parsii `.compact`-fixturen ja tulostaa rivien statit |
| **P1 — sisältö tilalle** | `sets/reps/weight` → `[CompactRow]`; `planLine()` → `[StatPart]`; `moveCard()` renderöi parsitun rivin | session-näkymä näyttää parsittua sisältöä, `rt:frame` vihreä |
| **P2 — L0 core** | Core-familiat (`exercise`, `move`, `interval`, `pyramid`, `split`) §5.2–5.4:n varianteilla + orakkelifixturet | L0 vihreä core-caseille |
| **P3 — rivikirjasto** | Loput familiat EVG-renderöijinä; teema `realtrainer.css`:ään; pitkä dokumentti `ScrollAreaCtl`illa | MONSTER.compact renderöityy kokonaan |
| **P4 — ajastin** | `WorkoutTimingController` → Ranger; dial lukee segmenttejä; L1 | L1 vihreä |
| **P5 — vuorovaikutus** | Rivin muokkaus (`InputCtl`, `NumberCtl`, `StepperCtl`), `RtBackendSim`, L2-tarkistukset | edit → save → uudelleenlataus säilyy |
| **P6 — kattavuus** | Kattavuusraportti kirjoittaa `COMPACT_FEATURE_MATRIX.md`:n | ei `❓`-soluja |
| **P7 — natiivi** | Kotlin- ja Swift-käännös; `gallery/ui/android` ja `/ios` -hostien savutesti | sama lähde ajaa mobiilissa, nolla JS |

Jokainen vaihe pitää `rt:check`in ja `rt:frame`in vihreänä; screenshotit päivitetään `rt:shots`illa,
jolloin README:n kuvat eivät ajaudu erilleen siitä mitä sovellus piirtää.

---

## 7. Riskit

| Riski | Vaikutus | Torjunta |
|-------|----------|----------|
| Parserin lähde on yksityisessä repossa (122 tiedostoa, 17,7k riviä) | `rt:check` ei aja CI:ssä | §3: vendorointi + sync-skripti; ratkaistava ennen P0:aa |
| Rivikirjasto on kokonaan uutta koodia | suurin yksittäinen työmäärä | L0 ensin: kun muotoilu on Rangerissa ja mitattu, EVG-renderöijä on mekaaninen |
| `WorkoutTimingController` on 940 riviä tilakonetta | työläs, virhealtis | vasta P4; olemassa olevat testit ovat spesifikaatio. Kirjaston oma `controller/PLAN.md` merkitsee `ActiveDurationTimer.tsx`:n (721 r) korvattavaksi — älä porttaa sen sisäistä tilaa |
| 31 familiaa on iso shape | käännösaika, kääntäjän rajat | kasvatetaan familia kerrallaan; pieni shape on jo todettu toimivaksi (§2) |
| Teksti-intensiivinen UI EVG:llä | rivien mitoitus ja katkaisu | `EVGText`, `EVGTextFit`, `EVGTextMeasurer` ovat olemassa; P1 mittaa yhden rivin ennen kirjastoa |
| Ei Radix-vastinetta rivikomponenteille | L2:lta puuttuu orakkeli | orakkelina `ui/react`:n DOM samassa kenttämuodossa |
| AGPL (`gallery/`) vs GPL (`realtrainer-compact`) | lisenssiepäselvyys | yhteensopiva suunta (AGPL §13); vendoroitu parseri saa oman merkinnän |

---

## 8. Ensimmäinen konkreettinen askel

1. Päätä parserin sijainti (§3) — estää kaiken muun.
2. `gallery/realtrainer/src/CompactRow.rgr`: shape `exercise`-familialla, `CompactStatBuilder`
   `match`illa. Malli on §2:n varmistettu koe.
3. `moveCard()` lukemaan `[StatPart]` `planLine()`-merkkijonon sijaan — yksi rivi, sama pikseli.
4. Ensimmäinen L0-testi: `Exercise Takakyykky|3x5@90kg` → `[StatPart]` TS-orakkelista ja
   Rangerista, deep-equal. Kirjaston oma `CompactBlogView.parity.test.tsx` odottaa muotoa
   `3x5x90kg`.
