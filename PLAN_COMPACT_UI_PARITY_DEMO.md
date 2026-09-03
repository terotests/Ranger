# PLAN — `realtrainer-compact` UI:n portti Rangerin UI-järjestelmään

Status: `suunnitelma` · 2026-09-03

Tavoite: portata [`RealTrainer/realtrainer-compact`](https://github.com/RealTrainer/realtrainer-compact):n
React-komponenttikirjasto (`ui/react`, julkaistu nimellä `@realtrainer/compact-ui-react`,
export `realtrainer-compact/ui`) Rangerin UI-järjestelmään ja mitata parity alkuperäisiä
komponentteja vastaan demo-kansiossa. **Ei Google Cloud -integraatiota**: UI-logiikkaa ja
simuloituja backend-kutsuja vain.

---

## 1. Miksi tämä kirjasto on poikkeuksellisen hyvä porttikohde

`ui/react` on jo jaettu täsmälleen niihin kerroksiin, joita Ranger-portti tarvitsee. Työ ei ole
arkkitehtuurin keksimistä vaan olemassa olevan rajan siirtämistä kielirajan yli.

| Kerros | Tiedostot | Rivit | Riippuu Reactista? |
|--------|-----------|------:|--------------------|
| Headless-kontrollerit | `lib/controller/WorkoutTimingController.ts` (940), `WorkoutSessionController.ts`, `VirtualClock.ts`, `workout-controller-types.ts` | ~1 500 | **ei** |
| Datamalli + mappaus | `lib/types.ts` (`CompactRow`, `CompactStatPart`), `lib/parsedRowMapping.ts`, `lib/normalizedWorkouts.ts` | ~750 | ei (yksi `ReactNode`-koukku) |
| Muotoilijat | `lib/formatters.ts`, `rows/utils/*` | ~350 | ei |
| Komponentit | `atoms/` 6, `molecules/` + 13 rivikomponenttia, `organisms/` 7 | ~2 700 | kyllä |

Kolme asiaa tekee tästä helpon:

1. **Kontrollerit ovat jo React-vapaita** tilakoneita, joissa on `getState()` / `subscribe()` ja
   typed events (`state-changed`, `step-started`, `countdown-threshold-reached`). Käsitteellisesti
   sama asia kuin Rangerin `@process` + `markStateDirty()`.
2. **`VirtualClock` on jo abstrahoitu** (`advanceBy`, `setNow`, playback rate). Rangerissa kello
   kuuluu hostiin — `active-workout-process/src/host/workoutClockHost.ts` tekee tämän jo.
   Deterministinen testiajo säilyy sellaisenaan.
3. **`CompactStatPart { text, tone, kind }` on jo esitys-DTO.** `formatters.ts` tuottaa valmiiksi
   muotoillut osat ja komponentit vain renderöivät ne — eli kirjaston tekijä on jo tehnyt sen
   DTO-jaon, jonka Ranger-builderin kuuluu tuottaa.

Lisäksi ainoa ajonaikainen riippuvuus on `clsx`, peer-riippuvuutena React. **Ei Firebasea, ei
i18nextiä, ei pilveä** — toisin kuin monorepon `frontend/`. Portti ei tarvitse yksityistä repoa.

Ketjun molemmat päät ovat jo Rangeria: `parser-ranger-v1` on `realtrainer-compact` 3.0.0:n
parseribackend (`src/parser-ranger/compact_parser_v1.rgr` synkataan sieltä). Portti sulkee
välissä olevan aukon.

---

## 2. Kaksi raidetta — mikä "Rangerin UI-järjestelmä" tarkoittaa

Rangerissa on **kaksi** eri UI-järjestelmää, ja valinta niiden välillä määrää koko työn.

### Raide A — `@process` + view-DTO, React hostina

Domain- ja UI-tila `@process`-luokissa, plain DTO:t builderilla, React tilaa `markStateDirty()`:ä
`useSyncExternalStore`:lla eikä pidä omaa tilaa. Referenssi:
`realtrainer/app-ranger/demo/active-workout-process/` (toimiva, testattu, parity-harness pystyssä).

- Rivikomponentit säilyvät Reactina; vain propsit vaihtuvat Ranger-DTO:iksi.
- Parity mitataan datana ja DOM:ina samaa komponenttia vastaan → hyvin tarkka mittari.
- Sama Ranger-lähde kääntyy Swiftille ja Kotlinille, mutta natiivi-UI pitää kirjoittaa erikseen.
- Työmäärä: keskisuuri. Riski: pieni.

### Raide B — `gallery/ui` EVG-kontrollerit, ei Reactia

`gallery/ui/` on 37 kontrolleria (`UiCtl`-kanta + `AccordionCtl`, `DialogCtl`, `TableCtl`,
`TabsCtl`, `ToastCtl`, `TreeCtl`, `VirtualCtl`, …), jotka mutatoivat EVG-display-treetä paikallaan.
Ei virtuaali-DOM:ia, ei reconcileria, ei render-passia. Hostit: WebGL, SDL+GL, SoftCanvas, PDF, HTML;
`gallery/ui/android/` ja `gallery/ui/ios/` ovat olemassa.

Parity-metodologia on täällä valmiiksi ratkaistu ja vahvempi kuin DOM-signatuuri:
**käyttäytymisparity, ei pikseliparity** — kummaltakin puolelta raportoidaan jokaisen syötteen
jälkeen 12 kenttää per test id (role, name, state, expanded, pressed, checked, selected, disabled,
hidden, tabstop, focused, visible) ja jäljet diffataan. Referenssinä ajetaan oikea Radix
Chromiumissa (`npm run ui:conformance`, `ui:report`, `ui:web`).

- COMPACT-rivit rakennettaisiin EVG-elementeiksi kontrollerien alle, ei JSX:nä.
- Tulos ajaa natiivina Androidilla ja iOS:llä samasta lähteestä.
- Työmäärä: iso. Riski: iso — rivikirjasto kirjoitetaan käytännössä uusiksi.

### Suositus

**A ensin, B sen päälle.** Raide A:n DTO-kerros (`CompactRow` shapena + `CompactStatPart[]`) on
täsmälleen se rajapinta, jonka B tarvitsee syötteekseen: kun muotoilu on Rangerissa, EVG-renderöijä
on uusi kuluttaja samalle DTO:lle eikä uusi portti. A tuottaa demon nopeasti; B on sen jälkeen
lisäys, ei uudelleenkirjoitus. Jos tavoite on nimenomaan natiivi mobiili-UI ilman Reactia, mene
suoraan B:hen — mutta rakenna DTO-kerros silti ensin.

Loput tästä dokumentista kuvaa raiteen A, ja merkitsee kohdat joissa B eroaa.

---

## 3. Kerroskartta: TS → Ranger

```text
  realtrainer-compact/ui/react              Ranger-portti
  ─────────────────────────────────────     ──────────────────────────────────────
  WorkoutSessionController          →       @process CompactSessionProcess
  WorkoutTimingController           →       @process WorkoutTimingProcess  (lapsi)
  VirtualClock / RealClock          →       host: compactClockHost.ts (tick → proc)
  controller events / subscribe     →       markStateDirty() + proc_send
  workout-controller-types.ts       →       shape WorkoutStep + Ranger-luokat
  ─────────────────────────────────────     ──────────────────────────────────────
  lib/types.ts  (CompactRow union)  →       shape CompactRow (§3.1)
  parsedRowMapping.ts               →       CompactRowMapper.rgr  (AST → rivi-DTO)
  formatters.ts                     →       CompactStatBuilder.rgr → CompactStatPart[]
  ─────────────────────────────────────     ──────────────────────────────────────
  rows/*.tsx, molecules/, organisms/ →      React, propsina Ranger-DTO   (raide A)
                                     →      EVG-kontrollerit gallery/ui:n päällä (raide B)
  src/renderers/{plaintext,markdown} →      CompactTextRenderer.rgr (headless sim)
```

Säännöt periytyvät referenssidemosta: React ei pidä domain-tilaa, lapsiprosessi ei importtaa
parenttia (synkka `pending*`-lipuilla), ja käännös jaetaan `CompactUiLib.rgr` (ei `@(main)`) /
`CompactUiMain.rgr` (sim).

### 3.1 `CompactRow` → Ranger `shape`

`lib/types.ts` on 13-haarainen diskriminoiva unioni (`exercise` | `pyramid` | `move` | `split` | …),
ja `COMPACT_FEATURE_MATRIX.md` listaa 31 rivifamiliaa.

Ranger osaa tämän nyt suoraan: `shape` / `case` / `match` (`PLAN_SHAPES.md` stagit S0–S5
toteutettu, `SHAPES_IS_OPERATOR.md`). **TypeScript- ja ES6-targetit lowertavat shapen tagatuksi
objektiksi (`__rg_kind`)** — eli täsmälleen samaksi rakenteeksi kuin TS:n oma union `type`-kentällä.
Vastaavuus on 1:1, ja `match` antaa kääntäjän tarkistaa, että jokainen familia on käsitelty.

> Huom: `RANGER_STYLE_REVIEW.md` §4 (2026-07-07) sanoo "ei sum-tyyppejä". Se on vanhentunut —
> `SliceParsedValue`:n 21 optional-kenttää on juuri se ongelma, jonka shapet ratkaisevat.
> Älä toista sitä mallia UI-DTO:ssa, äläkä myöskään luokkaperintöä: `PLAN_SHAPES.md` toteaa
> perinnön hajoavan Rust-targetilla (`RUST_ISSUES.md:567`).

### 3.2 Parseri prosessiin

Aloita niin, että host parsii ja prosessi saa AST-JSONin (`loadDocumentJson`), kuten
`ActiveWorkoutExtract.rgr` nyt. Kun P1 on vihreä, linkitä parserin `.rgr`-lähteet samaan bundleen:
silloin **teksti → DTO on yhtä Ranger-käännöstä** ja kääntyy myös Swiftille ja Kotlinille.
DTO-rajapinta ei muutu, joten vaihto ei kosketa Reactia.

---

## 4. Sijoitus ja repo-oikeudet

**Suositus:** demo `realtrainer/app-ranger/demo/compact-ui-process/`, koska tooling on siellä jo
pystyssä ja todistettu: Ranger-kääntäjän resolvointi (`resolve-ranger-compiler.mjs`, npm-paketti
ensin, checkout varalla), vite + vitest + Playwright, parity-harness, `check:production-isolation`.
Ranger-lähteet kirjoitetaan siirrettävään muotoon, ja kun ne vakiintuvat, ne siirtyvät
`realtrainer-compact/ui/ranger/`:iin `ui/react`:n rinnalle — julkiseen repoon jossa ne kuuluvat
olla, ja jossa parity ajaa samassa vitest-ajossa kuin kirjaston omat testit.

Raiteella B sijoitus on toinen: `gallery/ui/` on AGPL-3.0 Ranger-repossa, joten sen päälle
rakennettu COMPACT-kontrollerikirjasto kuuluu sinne (`gallery/ui/demo/CompactDemo.rgr` tai oma
gallery-moduuli), ei realtrainer-puolelle.

**Oikeudet tässä sessiossa:**

| Repo | Tila | Tarvitaan |
|------|------|-----------|
| `terotests/Ranger` | push (haara `claude/realtrainer-repo-integration-34dayr`) | — |
| `terotests/realtrainer` | **vain luku** | push-oikeus, jos demo menee `app-ranger/demo/`:hon |
| `RealTrainer/realtrainer-compact` | kloonattu julkisesti, **ei pushia** | oma sessio tällä repolla (`add_repo` ei salli eri omistajan repoa samaan sessioon) |

Kloonit osuivat sisarhakemistoiksi juuri niin kuin skriptit olettavat
(`parser-ranger-v1` → `../../realtrainer-compact`, ja `realtrainer-compact` → `../realtrainer/parser-ranger-v1`),
joten `compact-parity:test` ja `ranger:parity:minimonster:report` ovat ajettavissa tässä sessiossa.

---

## 5. Simuloitu backend

`realtrainer-compact` ei sisällä backendiä lainkaan, joten "ei pilveä" on lähtötila, ei rajoite.
Demo tarvitsee silti kutsupinnan, jotta lataus-, tallennus- ja virhetilat näkyvät UI:ssa.
`src/host/mockCompactBackend.ts`, sama muoto kuin `mockWorkoutSaveBackend.ts` nyt:

| Operaatio | Simulaatio |
|-----------|-----------|
| `listDocuments()` | fixture-hakemisto + `localStorage`, 120–300 ms viive |
| `loadDocument(id)` | teksti fixtureista, viive, valinnainen 404 |
| `saveDocument(id, compact)` | viive + `localStorage`, palauttaa version |
| `streamAssist(prompt)` | striimaa chunkkeina valmiin COMPACT-vastauksen |
| virhe-injektio | `?fail=save` → virhetilat testattavissa |

Fixturit: `realtrainer-compact/MONSTER.compact`, `MINI_TRAINING_PLAN.compact`, `data/`, `examples/`
sekä `realtrainer/training_data/*.compact` (9 tiedostoa).

---

## 6. Parity-mittaristo

Neljä tasoa, halvin ensin. **L0 on tämän portin tärkein** ja se, jota nykyinen demo ei vielä tee.

### L0 — DTO- ja muotoiluparity (puhdas data, ei DOM:ia, ei selainta)

Aja sama `.compact`-syöte molempien läpi ja vertaa rakenteita:

- `parsedRowMapping.ts` → `CompactRow[]`  ⟷  `CompactRowMapper.rgr` → shape-arvot
- `formatters.ts` → `CompactStatPart[]`  ⟷  `CompactStatBuilder.rgr` → sama

Koska `CompactStatPart` on `{ text, tone, kind }` ja Ranger-shape lowertaa TS:ssä tagatuksi
objektiksi, vertailu on suora deep-equal. Tämä nappaa valtaosan puutteista — yksiköt, rangeet
(`2-3x15-20`), bilateraalisuus (`2x10+10`), RM, mitatut kestot (`45s, 45s`), palautus
(`/2-3min`, `/hölkkä`), pace (`@3:50-3:40/km`), HR (`@120-150bpm`) — ilman selainta, jokaisella
committilla.

### L1 — kontrolleriparity (virtuaalikello, ei DOM:ia)

`WorkoutTimingController`:n olemassa olevat yksikkötestit ajetaan Ranger-prosessia vastaan samalla
skenaariolla: `VirtualClock.advanceBy(n)` ⟷ `tickWorkoutClock(n)`. Verrataan
`WorkoutControllerState`-snapshotteja ja tapahtumajonoja askel askeleelta. Testitapaukset ovat jo
olemassa (`lib/controller/`-testit, `ActiveWorkoutSession.test.tsx`).

### L2 — DOM-signatuuriparity (Playwright, `reference.html`)

Kopioi `active-workout-process`:n koneisto sellaisenaan: `domSignature.ts`, side-by-side -harness,
`known-deviations.json` (`intentional` / `debt`). Uusi ero kaataa buildin, ja listalla oleva ero
joka ei enää esiinny kaataa myös. Parity saavutettu kun `debt` on tyhjä.

Vasen sarake = alkuperäinen `CompactRowView` propseilla `CompactRow`, oikea = **sama komponentti**
propseilla Ranger-DTO. Mitataan siis puhtaasti datakerroksen eroa — tarkempi mittari kuin nykyisen
demon komponenttiparity.

Raiteella B tämä taso korvautuu `gallery/ui`:n conformance-jäljillä (12 kenttää per test id).

### L3 — laskettujen tyylien parity

`design-parity.spec.ts`:n kaava, yksi Tailwind-build, molemmat sarakkeet samassa dokumentissa.
Tarpeen vasta jos rivikomponentteja kirjoitetaan uusiksi.

### 6.1 Case-korpus ja kattavuusraportti

`parity/cases/` — yksi `.compact`-katkelma per `COMPACT_FEATURE_MATRIX.md`:n solu + manifesti:

```json
{ "id": "exercise-set-range-rep-range", "family": "exercise",
  "dimension": "range", "compact": "Squat|2-3x15-20@60kg", "matrix": "5.2" }
```

`scripts/report-compact-coverage.mjs` lukee L0–L3-liput ja **kirjoittaa
`COMPACT_FEATURE_MATRIX.md`:n coverage-taulukon uusiksi**: `❓` → `✅ / 🟡 / ❌` mitatusta datasta.
Taulukossa on 31 riviä × 7 saraketta pelkkiä `❓`-merkkejä; tämä tekee siitä elävän tulostaulun.

Prioriteetti matriisin §5.5 mukaan: `exercise` → `move` → `interval` → `pyramid` → `split`, sitten
kevyet rivit.

---

## 7. Vaiheistus (raide A)

| Vaihe | Sisältö | Valmis kun |
|-------|---------|-----------|
| **P0 — runko** | Kansio `compact-ui-process/`, konfigit referenssidemosta, `CompactUiLib.rgr`, `shape CompactRow` + `exercise`-familia, `loadDocumentJson`, `npm run dev` renderöi yhden fixturen | fixture renderöityy Ranger-DTO:sta |
| **P1 — L0 core** | `CompactRowMapper` + `CompactStatBuilder` core-familioille (`exercise`, `move`, `interval`, `pyramid`, `split`) §5.2–5.4:n varianteilla; L0-vertailutestit | L0 vihreä core-caseille |
| **P2 — kontrollerit** | `WorkoutTimingController` + `WorkoutSessionController` → `@process`; host-kello; L1 olemassa olevilla testeillä | L1 vihreä |
| **P3 — harness** | `reference.html`, L2, `known-deviations.json`; `npm run sim` (Ranger-tekstirenderöijä) | `debt`-lista olemassa ja kutistuu |
| **P4 — simuloitu backend + edit** | `mockCompactBackend`, rivin muokkaus prosessissa (`CompactRowEdit`-vastine), `localStorage` reloadin yli (e2e) | edit → save → reload säilyy |
| **P5 — kattavuus** | Loput familiat; kattavuusraportti kirjoittaa matriisin | matriisissa ei `❓`-soluja |
| **P6 — parseri bundleen** | §3.2 loppuun; Swift/Kotlin-käännöksen savutesti | teksti → DTO yhdellä Ranger-käännöksellä |
| **P7 — raide B (valinnainen)** | EVG-kontrollerit `gallery/ui`:n päällä samalle DTO:lle; conformance-jäljet | rivit renderöityvät EVG-hostilla |

`check:production-isolation` laajennetaan uuteen kansioon heti P0:ssa, jotta demo pysyy demona.

---

## 8. Riskit

| Riski | Vaikutus | Torjunta |
|-------|----------|----------|
| `WorkoutTimingController` on 940 riviä tilakonetta | työläin yksittäinen pala | portataan P2:ssa vasta kun L0 vihreä; olemassa olevat testit ovat spesifikaatio |
| `ActiveDurationTimer.tsx` (721 r) sisältää omaa ajastinlogiikkaa | kaksi kelloa, epädeterministinen parity | kirjaston oma `controller/PLAN.md` merkitsee sen korvattavaksi — portti tekee juuri sen; älä porttaa sen sisäistä tilaa |
| Shape-tuki on tuore (S0–S5) | kääntäjäbugeja voi tulla vastaan | 31 familiaa on iso shape — savutesti P0:ssa pienellä shapella ennen koko mallin kirjoittamista |
| `CompactUiRenderers.renderRow` ottaa `ReactNode`:n | ei käänny Rangeriin | jää hostiin: DTO kantaa datan, render-koukku on React-puolen asia |
| Kirjasto elää (v0.1.0, aktiivinen kehitys) | portti ajautuu erilleen | L0 ajetaan kirjaston omaa `ui/react`-lähdettä vastaan, ei kopiota; ajo CI:hin |
| Portti eri repossa kuin kohde | parity ei näe molempia | §4: aloita monorepon demossa, siirrä `ui/ranger/`:iin kun vakiintunut |

---

## 9. Ensimmäinen konkreettinen askel

1. Valitse raide (§2) ja sijoitus (§4); hanki kirjoitusoikeus siihen repoon.
2. Savutesti: pieni `shape` 3–4 casella + `match`, käännä `-typescript`, tarkista `__rg_kind`-muoto.
3. `cp -r app-ranger/demo/active-workout-process compact-ui-process`, riisu Active Workout -sisältö,
   jätä koneisto.
4. Ensimmäinen L0-testi: `Exercise Takakyykky|3x5@90kg` → `CompactStatPart[]` TS:stä ja Rangerista,
   deep-equal. Sama tapaus kuin kirjaston oma `CompactBlogView.parity.test.tsx` odottaa muodossa
   `3x5x90kg`.
