# PLAN — RealTrainer-UI EVG-komponenteilla (`gallery/`)

Status: `suunnitelma` · 2026-09-03

**Päätös:** RealTrainerin UI portataan Rangerin **EVG-pohjaisille komponenteille**
(`gallery/ui` + `gallery/evg`). Reactia tai käsin kirjoitettua JavaScriptiä ei jää.
Benchmarkkina käytetään `realtrainer-compact`-kirjaston Ranger-versiota ja sen TS-kirjaston
käyttäytymistä. Sijoitus: **Ranger-repo, `gallery/`**. Ei Google Cloud -integraatiota —
UI-logiikkaa ja simuloituja backend-kutsuja vain.

Lähteet: [`RealTrainer/realtrainer-compact`](https://github.com/RealTrainer/realtrainer-compact)
(`ui/react`, [docs](https://realtrainer.github.io/realtrainer-compact/docs/)) ja
`terotests/realtrainer` (`parser-ranger-v1`, `frontend/`).

---

## 1. Mitä "ei JavaScriptiä" tarkoittaa tarkalleen

Tämä on jo `gallery/ui/demo/`:n vakiintunut sopimus, ei uusi vaatimus. `demo/build.mjs` sanoo sen
suoraan: *"Everything bundled here is this repository's own source: nothing on the page imports
React or a Radix component."*

| Kerros | Selain | Android / iOS |
|--------|--------|---------------|
| UI-logiikka, komponentit, layout, muotoilu | Ranger `.rgr` → generoitu ES6 | Ranger `.rgr` → Kotlin / Swift |
| Piirto | `gallery/evg/gl/evg-webgl.js` (WebGL-painter) | natiivi host (`gallery/ui/android/`, `gallery/ui/ios/`) |
| Bootstrap | ~40 riviä sivun käynnistystä + `esbuild`-bundlaus | Gradle / Xcode |

Käsin kirjoitettua sovelluslogiikkaa JavaScriptillä ei siis ole missään. React esiintyy `gallery/ui`
-puussa vain yhdessä paikassa: `web/main.jsx` on **Radix-referenssi** conformance-vertailua varten,
ei tuote. Mobiilipuolella JS:ää ei ole lainkaan.

---

## 2. Mistä portataan — ja mikä on lähde, mikä spesifikaatio

`realtrainer-compact/ui/react` on **käyttäytymisspesifikaatio ja testiorakkeli**, ei koodilähde.
Sen arvo tässä on, että se on jo jaettu kerroksiin joissa vain ylin on Reactia:

| Kerros | Tiedostot | Rivit | Kohtalo |
|--------|-----------|------:|---------|
| Headless-kontrollerit | `lib/controller/WorkoutTimingController.ts` (940), `WorkoutSessionController.ts`, `VirtualClock.ts` | ~1 500 | **portataan** Ranger-kontrollereiksi |
| Datamalli | `lib/types.ts` (`CompactRow` 13-haarainen union, `CompactStatPart`) | ~250 | **portataan** Ranger `shape`ksi |
| Mappaus + muotoilu | `parsedRowMapping.ts` (412), `formatters.ts` (212), `rows/utils/*` | ~750 | **portataan** Rangeriin |
| React-komponentit | `atoms/` 6, `molecules/` +13 riviä, `organisms/` 7 | ~2 700 | **korvataan** EVG-kontrollereilla; jäävät orakkeliksi |

Kolme asiaa tekee tästä poikkeuksellisen suoraviivaista:

1. **Kontrollerit ovat jo React-vapaita** tilakoneita (`getState()` / `subscribe()`, typed events) ja
   `VirtualClock` on jo abstrahoitu (`advanceBy`, `setNow`, playback rate). Deterministinen testiajo
   säilyy sellaisenaan Rangerissa.
2. **`CompactStatPart { text, tone, kind }` on jo esitys-DTO** — muotoilu on erotettu renderöinnistä,
   eli juuri se raja jonka EVG-portti tarvitsee. Kirjaston tekijä on tehnyt työn puolestamme.
3. **`ActiveDurationTimer.tsx` (721 r) on jo merkitty korvattavaksi** kirjaston omassa
   `lib/controller/PLAN.md`:ssä ("bug-prone React-local timer logic to treat as behavior reference,
   not as implementation base"). Portti tekee täsmälleen sen, mitä kirjasto itse aikoi tehdä.

Vanhan tuotanto-UI:n (`realtrainer/frontend/src/components/`) rooli on visuaalinen referenssi:
`ContentRows.tsx` (648 r), `WorkoutBlogContent.tsx`, `ExerciseRow.tsx`, `MoveRow.tsx`. Sitä ei
portata — se on Firebase- ja i18next-kytketty, ja `ui/react` on sama sisältö puhtaana.

---

## 3. Arkkitehtuuri

```text
  .compact-teksti
      │
      ▼
  CompactV1Parser              (Ranger, parser-ranger-v1 — §3.3)
      │  AST-solmut
      ▼
  CompactRowMapper.rgr    →    shape CompactRow  (31 familiaa, §3.1)
  CompactStatBuilder.rgr  →    CompactStatPart[]  (valmiiksi muotoiltu)
      │
      ▼
  RtRowCtl / RtWorkoutCtl / RtSessionCtl        ← UiCtl-kantaiset kontrollerit
      │  mutatoivat paikallaan
      ▼
  EVGElement-puu  →  EVGStyleSheet.applyTree()  →  EVGLayout  →  EVGDisplayList
      │
      ├─ WebGL (selain)   ├─ SDL+GL   ├─ SoftCanvas   ├─ PDF
      └─ Android / iOS natiivi
```

Ei virtuaali-DOM:ia, ei reconcileria, ei render-passia: kontrolleri omistaa alipuunsa ja
mutatoi sitä, tila elää kontrollerin kentissä. Tämä on `UiCtl`:n sopimus.

### 3.1 `CompactRow` → Ranger `shape`

`lib/types.ts` on 13-haarainen diskriminoiva unioni; `COMPACT_FEATURE_MATRIX.md` listaa 31
rivifamiliaa. Ranger osaa tämän suoraan: `shape` / `case` / `match` (`PLAN_SHAPES.md` S0–S5
toteutettu, `SHAPES_IS_OPERATOR.md`), ja `match` antaa kääntäjän tarkistaa että jokainen familia on
käsitelty täsmälleen kerran.

> `RANGER_STYLE_REVIEW.md` §4 (2026-07-07) väittää ettei Rangerissa ole sum-tyyppejä. Se on
> vanhentunut. Älä käytä `SliceParsedValue`-mallia (21 optional-kenttää unionin korvikkeena),
> äläkä luokkaperintöä: `PLAN_SHAPES.md` toteaa perinnön hajoavan Rust-targetilla
> (`RUST_ISSUES.md:567`).

### 3.2 Mitä `gallery/ui` antaa valmiina, mitä pitää rakentaa

Valmiina (37 kontrolleria, `UiCtl`-kanta, kaikki Radix-mitattuja):

| Tarve RealTrainer-UI:ssa | Valmis kontrolleri |
|--------------------------|--------------------|
| Pitkä harjoituslista, vieritys | `ScrollAreaCtl`, `ScrollerCtl`, `VirtualCtl` |
| Harjoituksen osiot auki/kiinni | `AccordionCtl`, `CollapsibleCtl` |
| Sarjan/toiston numeeriset kentät | `NumberCtl`, `StepperCtl`, `SliderCtl` |
| Rivin muokkaus, tekstikenttä | `InputCtl` |
| Vahvistukset, lopetusmodaali | `DialogCtl`, `AlertDialogCtl`, `PopoverCtl` |
| Ilmoitukset, tallennuspalaute | `ToastCtl` |
| Näkymien vaihto | `TabsCtl`, `NavMenuCtl`, `BreadcrumbCtl` |
| Tilastotaulukot | `TableCtl`, `SortableCtl` |
| Päivämäärävalinta, kalenterinäkymä | `CalendarCtl`, `EventCalCtl` |

Rakennettava uutta: **COMPACT-rivikirjasto** — `RtRowCtl` ja familiakohtaiset renderöijät, jotka
kääntävät `CompactRow`-shapen EVG-elementeiksi. Tämä on työn ydin ja ainoa iso uusi pala.
`gallery/ui/demo/DashboardDemo.rgr` (2 308 r) on lähin esikuva sivutason kokoonpanosta.

### 3.3 Parserin sijainti on avoin kysymys

`compact_parser_v1.rgr` -lähde (**122 tiedostoa, 17 768 riviä**) on yksityisessä repossa
`realtrainer/parser-ranger-v1/src/`. `realtrainer-compact` vendoroi vain **generoidun
TypeScriptin** (`src/parser-ranger/compact_parser_v1.ts`, 8 494 r), ei `.rgr`-lähdettä.

Ranger-repon `gallery/`-demo tarvitsee `.rgr`-lähteen. Kolme vaihtoehtoa:

1. **Sync-skripti sisarcheckoutista** — kuten `realtrainer-compact/scripts/sync-parser-from-ranger-v1.mjs`
   tekee jo. Ei kopiota versionhallinnassa, mutta demo ei käänny ilman yksityistä checkoutia.
2. **Vendorointi `gallery/realtrainer/parser/`:iin** + sync-skripti ajautumisen estoon. Demo kääntyy
   itsenäisesti; 17,7k riviä kopiota ylläpidettävänä.
3. **Parserin julkaisu** `realtrainer-compact`iin `.rgr`-lähteenä (se on jo sen paketin
   parseribackend). Siistein, mutta vaatii muutoksen toiseen repoon.

**Suositus: (1) aluksi, (3) tavoitteena.** Lisenssihuomio: `gallery/` on AGPL-3.0-or-later,
`realtrainer-compact` GPL-3.0-or-later. GPLv3-lähteen käyttö AGPLv3-projektissa on sallittua
(AGPL §13), mutta vendoroitu kopio tarvitsee oman lisenssimerkinnän.

---

## 4. Sijoitus

**Suositus: oma gallery-moduuli `gallery/realtrainer/`**, ei `gallery/ui/demo/`-sivu.

Perustelu: `gallery/ui/demo/` on kontrollikirjaston näyteikkuna (18 sivua, 12 481 riviä, kukin
esittelee kontrollereita). RealTrainer on sovellus, jolla on oma domain-malli, oma parseri, oma
tilakone ja oma simuloitu backend. Se kuluttaa `gallery/ui`:ta samalla tavalla kuin `gallery/book`
kuluttaa EVG:tä.

```text
gallery/realtrainer/
  src/          RtRowCtl, RtWorkoutCtl, RtSessionCtl, CompactRowMapper, CompactStatBuilder
  parser/       synkattu compact_parser_v1 (§3.3)
  theme/        EVGStyleSheet — RealTrainerin tokenit
  demo/         RealTrainerDemo.rgr — ajettava sivu + build.mjs (demo/build.mjs:n kaava)
  tests/        Ranger-yksikkötestit (UiTest.rgr:n kaava)
  bench/        parity-orakkeli TS-kirjastoa vastaan (§5)
  fixtures/     .compact-syötteet
```

`package.json`-skriptit `rt:*`-etuliitteellä, `ui:*`:n kaavalla.

---

## 5. Benchmark ja parity

Kolme tasoa. Orakkelina TS-kirjasto, joka **ei ole osa buildia** — se ajetaan erikseen ja sen
tulos talletetaan JSON-fixtureiksi, jotta Ranger-puoli ei riipu Nodesta ajossa.

### L0 — DTO- ja muotoiluparity (puhdas data)

Aja sama `.compact` molempien läpi ja vertaa rakenteita:

- `parsedRowMapping.ts` → `CompactRow[]`  ⟷  `CompactRowMapper.rgr` → shape-arvot
- `formatters.ts` → `CompactStatPart[]`  ⟷  `CompactStatBuilder.rgr` → sama

`CompactStatPart` on `{ text, tone, kind }`, joten vertailu on suora deep-equal. Tämä nappaa
valtaosan puutteista — yksiköt, rangeet (`2-3x15-20`), bilateraalisuus (`2x10+10`), RM, mitatut
kestot (`45s, 45s`), palautus (`/2-3min`, `/hölkkä`), pace (`@3:50-3:40/km`), HR (`@120-150bpm`) —
ilman selainta, jokaisella committilla. **Tämä on portin tärkein mittari.**

### L1 — kontrolleriparity (virtuaalikello)

`WorkoutTimingController`:n olemassa olevat yksikkötestit ajetaan Ranger-kontrolleria vastaan
samalla skenaariolla: `VirtualClock.advanceBy(n)` ⟷ Ranger-kellon tick. Verrataan tilasnapshotteja
ja tapahtumajonoja askel askeleelta. Testitapaukset ovat jo olemassa.

### L2 — käyttäytymisparity (`gallery/ui` conformance)

Sama koneisto kuin kontrollereilla nyt: jokaisen syötteen jälkeen 12 kenttää per test id (role,
name, state, expanded, pressed, checked, selected, disabled, hidden, tabstop, focused, visible),
jäljet diffataan. Uusille RealTrainer-kontrollereille kirjoitetaan omat spec-tiedostot
`conformance/specs/`-kaavalla. Radix-referenssiä ei ole rivikomponenteille, joten orakkelina toimii
`ui/react`:n renderöimä DOM `snapshotDom`-muodossa — sama kenttäjoukko, eri lähde.

**Pikseliparityä ei tavoitella.** Layout-moottorit eroavat tarkoituksella; vertailtava asia on se,
mitä käyttäjä voi havaita.

### 5.1 Case-korpus ja kattavuusraportti

`fixtures/cases/` — yksi `.compact`-katkelma per `COMPACT_FEATURE_MATRIX.md`:n solu + manifesti:

```json
{ "id": "exercise-set-range-rep-range", "family": "exercise",
  "dimension": "range", "compact": "Squat|2-3x15-20@60kg", "matrix": "5.2" }
```

Raportti lukee L0–L2-liput ja kirjoittaa matriisin coverage-taulukon uusiksi: `❓` → `✅ / 🟡 / ❌`.
Taulukossa on 31 riviä × 7 saraketta pelkkiä `❓`-merkkejä; tämä tekee siitä elävän tulostaulun.
Prioriteetti §5.5:n mukaan: `exercise` → `move` → `interval` → `pyramid` → `split`, sitten kevyet.

Korpuksen lähteet: `realtrainer-compact/MONSTER.compact`, `MINI_TRAINING_PLAN.compact`, `data/`,
`examples/` ja `realtrainer/training_data/*.compact` (9 tiedostoa).

---

## 6. Simuloitu backend

`realtrainer-compact` ei sisällä backendiä lainkaan, joten "ei pilveä" on lähtötila. Demo tarvitsee
silti kutsupinnan, jotta lataus-, tallennus- ja virhetilat näkyvät UI:ssa. Rangerissa:
`RtBackendSim.rgr` — kontrolleri joka viivästää vastauksia simuloidulla kellolla, striimaa
chunkkeina, ja osaa injektoida virheen.

| Operaatio | Simulaatio |
|-----------|-----------|
| `listDocuments()` | fixture-hakemisto, 120–300 ms simuloitua viivettä |
| `loadDocument(id)` | teksti fixtureista, viive, valinnainen 404 |
| `saveDocument(id, compact)` | viive, palauttaa version; persistointi hostin kautta |
| `streamAssist(prompt)` | striimaa chunkkeina valmiin COMPACT-vastauksen |
| virhe-injektio | demon nappi → virhetilat testattavissa |

Sama simuloitu kello kuin L1:ssä, joten backendin viiveet ovat deterministisiä testeissä.

---

## 7. Vaiheistus

| Vaihe | Sisältö | Valmis kun |
|-------|---------|-----------|
| **P0 — pystytys** | `gallery/realtrainer/`, parserin sync (§3.3), `shape CompactRow` + `exercise`-familia, `RtRowCtl` renderöi yhden rivin EVG:hen, `rt:demo` avaa sivun | yksi harjoitusrivi näkyy selaimessa EVG:llä |
| **P1 — L0 core** | `CompactRowMapper` + `CompactStatBuilder` core-familioille §5.2–5.4:n varianteilla; L0-orakkelifixturet ja vertailu | L0 vihreä core-caseille |
| **P2 — rivikirjasto** | Loput familiat EVG-renderöijinä; teema `EVGStyleSheet`nä; pitkä dokumentti `ScrollAreaCtl`illa | MONSTER.compact renderöityy kokonaan |
| **P3 — kontrollerit** | `WorkoutTimingController` + `WorkoutSessionController` → Ranger; simuloitu kello; L1 | L1 vihreä |
| **P4 — vuorovaikutus** | Rivin muokkaus (`InputCtl`, `NumberCtl`, `StepperCtl`), modaalit, `RtBackendSim`; L2-spec-tiedostot | conformance-jäljet olemassa ja kutistuvat |
| **P5 — kattavuus** | Kattavuusraportti kirjoittaa `COMPACT_FEATURE_MATRIX.md`:n | ei `❓`-soluja |
| **P6 — natiivi** | Käännös Kotlinille ja Swiftille; `gallery/ui/android` ja `/ios` -hostien savutesti | sama lähde ajaa mobiilissa, nolla JS |

---

## 8. Riskit

| Riski | Vaikutus | Torjunta |
|-------|----------|----------|
| Parserin lähde on yksityisessä repossa (122 tiedostoa, 17,7k riviä) | `gallery/`-demo ei käänny itsenäisesti | §3.3: sync-skripti heti, julkaisu tavoitteena; ratkaistava ennen P0:aa |
| COMPACT-rivikirjasto on kokonaan uutta koodia | suurin yksittäinen työmäärä | L0 ensin: kun muotoilu on Rangerissa ja mitattu, EVG-renderöijä on kirjoittajalle mekaaninen |
| `WorkoutTimingController` on 940 riviä tilakonetta | työläs, virhealtis | portataan vasta P3:ssa; olemassa olevat testit ovat spesifikaatio |
| Shape-tuki on tuore (S0–S5) | kääntäjäbugeja voi tulla vastaan | P0:ssa savutesti pienellä shapella ennen 31-familian mallia |
| Ei Radix-vastinetta rivikomponenteille | L2:lta puuttuu orakkeli | orakkelina `ui/react`:n DOM `snapshotDom`-muodossa, sama kenttäjoukko |
| Teksti-intensiivinen UI EVG:llä | rivien mitoitus ja katkaisu | `EVGText`, `EVGTextFit`, `EVGTextMeasurer` ovat olemassa; P0 mittaa yhden rivin ennen kuin kirjastoa kirjoitetaan |
| AGPL (`gallery/`) vs GPL (`realtrainer-compact`) | lisenssiepäselvyys | yhteensopiva suunta (AGPL §13); vendoroitu parseri saa oman merkinnän |

---

## 9. Ensimmäinen konkreettinen askel

1. Ratkaise parserin sijainti (§3.3) — tämä estää kaiken muun.
2. Savutesti: pieni `shape` 3–4 casella + `match`, käännä `-es6` ja `-kotlin`, varmista lowerointi.
3. `gallery/realtrainer/` pystyyn `gallery/ui/demo/build.mjs`:n kaavalla; yksi
   `Exercise Takakyykky|3x5@90kg` -rivi EVG-elementeiksi ja WebGL-piirtoon.
4. Ensimmäinen L0-testi: sama rivi → `CompactStatPart[]` TS-orakkelista ja Rangerista, deep-equal.
   Kirjaston oma `CompactBlogView.parity.test.tsx` odottaa tästä muotoa `3x5x90kg`.
