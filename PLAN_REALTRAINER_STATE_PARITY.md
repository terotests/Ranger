# PLAN — RealTrainerin tilanhallinta EVG:lle, mitattuna ajettavaa sovellusta vasten

Status: `S0 tehty: referenssi ajettu ja nauhoitettu · S1, S2, S4, S5: koneet ja näkymät tehty, tekstikentät hostattu · puhelimen kuori ja osiot piirretty · joka ruutu ≥ 97 % referenssistä, velho 100 %` · 2026-09-03
Liittyy: [`PLAN_COMPACT_UI_PARITY_DEMO.md`](PLAN_COMPACT_UI_PARITY_DEMO.md) (rivikerros, P0–P5 tehty)

COMPACT-rivit on portattu ja mitattu. Se on sovelluksen **sisältökerros**. Tämä suunnitelma
koskee sitä mitä sen ympärillä on: harjoitusten suunnittelu, vuosisuunnitelma, harjoitusten
parsinta ja kalenterien luonti — neljä aluetta joilla on oma tilakoneensa ja oma näkymänsä.

Benchmarkkina **sovelluksen paikallisesti ajettava versio Playwrightin päällä**, joka on jo
olemassa: `frontend` ajetaan `--mode test`, Firebase-emulaattorit auth+firestore, ja
`e2e/`-hakemistossa on Playwright-konfiguraatio, page objectit ja yhdeksän spec-tiedostoa.

---

## 1. Mitä portataan — alkuperäiset tiedostot

### 1.1 Tilakoneet ja kontrollerit

XState v5 -koneita, ja `machines/README.md` dokumentoi ne tilakaavioina ja tapahtumataulukkoina.
Kaavio **on** spesifikaatio: portin ei tarvitse päätellä käyttäytymistä lukemalla JSX:ää.

| Kone | Tiedosto | Riviä | Tilat | Kontrolleri |
|------|----------|------:|-------|-------------|
| Suunnitteludialogi | `frontend/src/machines/planDialogMachine.ts` | 289 | `closed` · `weekSelection` · `confirmation` · `editInstructions` · `regenerating` · `creating` | `machines/controllers/PlanDialogController.ts` (197) |
| Harjoituksen lisäys | `frontend/src/machines/addWorkoutDialogMachine.ts` | 123 | `closed` · `open` · `saving` | `machines/controllers/AddWorkoutDialogController.ts` (137) |
| AI-keskustelu | `frontend/src/machines/chatMachine.ts` | 449 | `idle` · `sending.streaming` · `reviewing.{deciding,singleAction,multiAction}` · `processing.{saving,done}` · `error` | `machines/controllers/ChatController.ts` (441) |

Kontrollerit ovat React-vapaita ja niillä on adapterikerros
(`adapters.ts`, `cloudAdapter.ts`, `localGeminiAdapter.ts`, **`mockAdapter.ts` 227 r**) — sama
rakenne kuin `realtrainer-compact`in `WorkoutTimingController`illa, ja `mockAdapter` on valmis
vastine sille mitä `RtBackendSim` tekee demossa nyt.

Storet ovat isompi ja sotkuisempi pala:

| Store | Tiedosto | Riviä |
|-------|----------|------:|
| Sovelluksen tila (kalenterit, viikot, navigaatio, käyttäjä) | `frontend/src/stores/appStore.ts` | 1 974 |
| Aktiivinen harjoitus | `frontend/src/stores/activeWorkoutStore.ts` | 1 378 |

### 1.2 Näkymät

| Alue | Näkymä | Tiedosto | Riviä |
|------|--------|----------|------:|
| Harjoitusten suunnittelu | Viikkosuunnittelun dialogi (isännöity dashboardilla) | `pages/DashboardPage.tsx` | 3 364 |
| | Jakson tiedot | `pages/PeriodDetailPage.tsx` | 734 |
| | Suunnitelman tuonti | `components/modals/PlanImportDialog.tsx` | — |
| Vuosisuunnitelma | Vuosinäkymä | `pages/YearSheetPageV2.tsx` | 1 926 |
| Harjoitusten parsinta | Lisäysdialogi + parseri-koukku | `hooks/useAddWorkoutDialogController.ts` (90), `lib/useCompactParser.ts` (134) | — |
| | Leikepöytätuonti | `components/modals/PasteImportModal.tsx` | — |
| Kalenterien lisäys | Uuden kalenterin sivu | `pages/NewCalendarPage.tsx` | 115 |
| | Kalenterivelho | `components/wizards/CalendarWizard.tsx` | 612 |
| | Luontimodaali | `components/modals/CreateCalendarModal.tsx` | — |

**Dashboard on solmukohta:** molempia dialogikoneita käytetään vain `DashboardPage.tsx`:stä, ja
se myös isännöi vuosinäkymän. 3 364 riviä on portin suurin yksittäinen este, ja syy tehdä
työ *kone kerrallaan* eikä *sivu kerrallaan*.

### 1.3 Mikä on jo Rangerilla

`app-ranger/lib` on **14 106 riviä** Rangeria kahdessatoista moduulissa, eli portilla on
etumatkaa jota tämä suunnitelma ei saa hukata:

| Moduuli | Riviä | Kattaa |
|---------|------:|--------|
| `stats` | 4 863 | tilastot ja aggregoinnit |
| `evg` + `phone_evg` + `watch_evg` | 5 641 | EVG-näkymiä jo nyt |
| `workout` | 1 457 | harjoituksen purku ja mallit |
| `yearsheet` | 722 | **vuosisuunnitelman logiikkaa** |
| `chat` | 673 | keskustelun logiikkaa |
| `coach`, `features`, `dates`, `parsing`, `test` | 750 | apukerrokset |

Vuosisuunnitelma ja chat ovat siis osittain portattuja. Ensimmäinen tehtävä kussakin
vaiheessa on selvittää mitä `app-ranger/lib`istä voi käyttää sellaisenaan.

---

## 2. Benchmark: ajettava sovellus Playwrightin päällä

### 2.1 Mikä on jo olemassa

```bash
cd e2e && npm test     # frontend --mode test :5175 + emulaattorit + playwright
```

`e2e/playwright.config.ts` ajaa yhdellä workerilla (testit jakavat emulaattorin tilan),
`global-setup.ts` varmistaa emulaattorit, ja `helpers/`issä on `auth`, `firestore`,
`functions`, `api-mocks` sekä page objectit. Spec-tiedostoja on yhdeksän:
`auth/` 2, `calendar/` 1, `chat/` 4, `devtools/` 1, `stats/` 1.

### 2.2 Miten parity mitataan

**Ei pikseleitä, ei DOM-signatuuria, vaan käyttäytymisjälki** — sama menetelmä jolla
`gallery/ui` mitataan Radixia vastaan: jokaisen syötteen jälkeen molemmilta puolilta
12 kenttää per solmu (role, name, state, expanded, pressed, checked, selected, disabled,
hidden, tabstop, focused, visible), ja jäljet diffataan.

**Avain on saavutettavuuspuu, ei test id.** Tämä ei ole makuasia: näissä näkymissä on
**nolla `data-testid`-attribuuttia** — `DashboardPage`, `YearSheetPageV2`, `NewCalendarPage`,
`CalendarWizard` ja `PeriodDetailPage` kaikki. Nykyiset page objectit yrittävät testidejä ja
putoavat rooleihin ja tekstiin (`getByTestId('add-calendar-btn').or(getByRole('button', …))`).
Testidien lisääminen olisi muutos yksityiseen repoon jokaista mitattavaa solmua kohti; roolit
ja nimet ovat jo siellä, ja ne ovat myös se mitä EVG-puoli julkaisee (`UiCtl.rows()`).

```text
  skenaario (askelia: click role+name | type | wait)
      │
      ├─→ React :5175 + emulaattorit  ── Playwright ──→ a11y-jälki  ──┐
      │                                                              ├── diff
      └─→ Ranger EVG (headless, oma kello) ─── press/tick ──→ jälki ──┘
```

Ranger-puoli ajaa **ilman selainta**: `RealTrainerDemo.a11yJson()` tuottaa jo saman
muotoisen puun, ja demon kello on sovelluksessa. React-puoli tarvitsee selaimen, koska
XState-kone ja Firestore-emulaattori ovat siellä.

### 2.3 Skenaarion muoto

```json
{ "id": "add-workout-open-and-cancel",
  "area": "parsinta",
  "machine": "addWorkoutDialog",
  "steps": [
    { "click": { "role": "button", "name": "Lisää harjoitus" } },
    { "expect": { "state": "open" } },
    { "type": { "role": "textbox", "text": "Exercise Kyykky|3x10" } },
    { "click": { "role": "button", "name": "Peruuta" } },
    { "expect": { "state": "closed" } }
  ] }
```

Askel on rooli + nimi, koska se on ainoa asia jonka molemmat puolet tuntevat. `expect.state`
on koneen tila, jonka React-puoli paljastaa (`window.__machineState`, kehitysrakennuksessa)
ja jonka Ranger-puoli tietää itsestään — se tekee jäljestä luettavan silloinkin kun
solmuero on iso.

### 2.4 Nauhoitus, kuten L0:ssa

Jälki **nauhoitetaan ja committoidaan**, samalla perusteella kuin `oracle/expected.json`:
Ranger-repon CI:ssä ei ole Firebase-emulaattoreita eikä yksityistä frontendiä, joten portti
vertaa nauhoitusta vasten. Nauhoituksen uusiminen on kehittäjän toimenpide siellä missä
sovellus ajaa: `rt:trace:record`. Vanhentuneen nauhoituksen huomaa siitä että portti kaatuu.

---

## 2.5 Kone datana — `gallery/statechart`

XState on **MIT** (Copyright © 2015 David Khourshid), joten kloonaaminen olisi sallittua.
Se on silti väärä asia rakentaa: klooni tarkoittaa API-yhteensopivuutta actoreiden,
spawnin, actor-systeemin ja inspectionin kanssa — joita yksikään portattava kone ei käytä —
ja sitä arvioitaisiin XStaten koko semantiikkaa vasten sen sovelluksen käyttäytymisen sijaan
jonka pitää pysyä toimivana.

Sen sijaan `gallery/statechart` on pieni ajonaikainen kone jossa **määrittely on dataa**.
Käytetty osajoukko on mitattu (`grep` kolmen koneen yli), ei arvattu:

| Kone | Käyttää |
|------|---------|
| `addWorkoutDialogMachine` | `id` · `initial` · `states` · `on` · `target` · `assign` |
| `planDialogMachine` | + ei mitään uutta (kuusi tilaa samaa) |
| `chatMachine` | + sisäkkäiset `states` · `initial` per taso · `guard`/`guards` · `always` · `onDone` · `type: 'final'` · koneen oma `on` |

**Mitään ei puutu.** `after`, `invoke`, `entry` ja `exit` eivät esiinny
yhdessäkään kolmesta. Aiempi versio tästä taulukosta väitti `chatMachine`n
käyttävän `after`ia ja `invoke`a — sen lähteessä on kommentti että tila
*voisi* kutsua tallennuspalvelua, mutta se ei kutsu: `SAVE_COMPLETE` on
tavallinen tapahtuma. Osajoukko ei siis ole osajoukko siitä mitä sovellus
tarvitsee, vaan se kaikki.

Kaikki kolme tasoa on toteutettu, ja jokainen tuli sen koneen mukana joka sitä tarvitsi:

| Taso | Tuli koneesta | Lisäsi |
|------|---------------|--------|
| yksi | `addWorkoutDialogMachine` | tilat · siirtymät valinnaisella kohteella · deklaratiiviset sijoitukset · tapahtumat nimettyine kenttineen |
| kaksi | `planDialogMachine` | tyypitetty konteksti (`ScVal`) · nimetyt hostin toiminnot |
| kolme | `chatMachine` | sisäkkäiset tilat · guardit · `always` · `type: "final"` + `onDone` · koneen oma `on` · guardatut siirtymälistat |

Kohteeton siirtymä sijoittaa muttei liiku — XStaten sisäinen siirtymä, ja syy siihen
ettei dialogiin kirjoittaminen aja `open`-tilaan uudelleen.

Sisäkkäisyys tuo kaksi asiaa. Aktiivinen tila on **polku** (`reviewing.multiAction`), koska
nimi ei ole osoite: kahdella vanhemmalla voi olla lapsi nimeltä `done`. Ja asettuminen
(`always`, `onDone`) **pysähtyy niin kauan kuin nimetty toiminto on velkaa**: `reviewing`
haarautuu kolmeen sen mukaan montako pending-actionia on, ja nimetty toiminto on se joka ne
sinne laittaa. Host ajaa mitä `pending` nimeää ja kutsuu `resume`. Ero on `multiAction`in ja
`idle`iin putoamisen välillä.

**Argumentti runnerin puolesta on rivimäärä.** Käsin kirjoitettu portti on ~150 riviä
haarautumista per kone; `planDialog`issa on kuusi tilaa ja 17 tapahtumaa ja `chat`issa
sisäkkäiset. Määrittelynä sama kone on kuvaus.

**Runner ottaa vastaan saman syötteen.** `StatechartJson.load()` lukee `createMachine()`:n
oman konfiguraatio-objektin: rakenne, tilanimet, tapahtumanimet, kohteet ja
`"EVENT": "target"` -lyhenne ovat XStaten. Kone on silloin **yksi tiedosto** jonka molemmat
puolet voivat pitää, kumpikaan ei toisen transkriptio. Ainoa mikä ei siirry sellaisenaan on
`assign`: XStatessa se on funktio eikä funktio ole dataa, joten sijoitukset kirjoitetaan
deklaratiivisesti — `{ "event": "value", "default": { "context": "today" } }` on
`event.targetDate || today` kirjoitettuna sen sijaan että se ajettaisiin.

Että konfiguraatio yhä *on* se kone, tarkistetaan eikä luoteta: `rt:machine:config` evaluoi
oikean TypeScriptin `xstate` tyngätettynä (`createMachine` palauttaa konfiguraationsa) ja
diffaa rakenteen — jokainen tila polkuna, kunkin käsittelemät tapahtumat, kohteet ja **mikä
nimetty guard päättää**, sekä alkulapsi, `type: "final"`, `always`, `onDone` ja koneen oma `on`.

Guard kirjoitetaan predikaattina (`present`, `nonBlank`, `countGt`, `some`, `or`/`and`/`not`)
mutta kantaa myös `named`-kentän — sen nimen jonka alkuperäinen sille antaa. Predikaatti
kertoo mitä guard *tekee*, nimi kertoo *mikä* guard se on, ja vain jälkimmäistä voi verrata
TypeScript-funktioon. `present` ja `nonBlank` ovat erikseen tarkoituksella: `hasContent` on
alkuperäisessä `inputText.trim().length > 0`, mikä ei ole sama kysymys kuin "onko merkkejä"
ja olisi lähettänyt tyhjän viestin välilyönnillä.

`gallery/statechart` on nyt **oma projektinsa**: pariteettiportti (`statechart:parity`)
ja sen omat koneet asuvat siellä, ja `rt:machine:live` on sama portti eri manifestilla.
Siellä on myös **visualisoija** RangerFlow'n päällä — sama kone piirrettynä, ja
`--run` piirtää *mihin tapahtumasarja jätti sen*: aktiivinen tila korostettuna ja
siitä lähtevät siirtymät korostevärillä. `chat.machine.json` on yksi sen kuvista.

**Kumpikaan portti ei yksin ole pariteetti.** `rt:machine:live` ajaa saman konfiguraation
molempien läpi, joten se mittaa *runneria* eikä voi koskaan huomata transkriptiovirhettä —
väärä guard on väärä identtisesti molemmilla puolilla. `rt:machine:config` lukee oikean
TypeScriptin, joten se huomaa transkription eikä voi ajaa mitään.

Konformanssi ei ole moduulin oma mielipide: `rt:machine` ajaa XState-lähteestä
transkriboidun taulukon **neljän toteutuksen** läpi — käsin kirjoitettu portti, sama kone
datana, sama konfiguraatio tämän runnerin ajamana, ja **sama konfiguraatio XStaten itsensä
ajamana** — ja kaikkien on oltava samaa mieltä. 21 solua, 13 niistä ignoreja, kaikki neljä
täsmäävät, sekä 400 satunnaissarjaa lukkoaskeleessa.

## 3. Vaiheistus

| Vaihe | Alue | Sisältö | Valmis kun |
|-------|------|---------|-----------|
| **S0 — jäljen koneisto** *(osin tehty)* | — | Tehty: skenaariomuoto (`fixtures/scenarios/`), Ranger-puolen toistin ja `rt:trace`-portti nauhoitettua jälkeä vasten, sekä referenssinauhoitin (`scripts/record-reference-trace.mjs`) joka ajaa Playwrightilla sovellusta vastaan. Jäljellä: **aja nauhoitin koneella jolla emulaattorit ovat** ja diffaa puolet | React-jälki nauhoitettu ja diffattu Ranger-jälkeä vasten |
| **S1 — harjoituksen lisäys** *(osin tehty)* | parsinta | Tehty: `AddWorkoutDialog.rgr` (3 tilaa, 7 tapahtumaa), **siirtymätaulukko kaikista 21 solusta** `rt:machine`-porttina — 13 niistä ignoreja — ja dialogi EVG:llä dokumenttinäkymässä, piirrettynä koneen tilasta. Jäljellä: oikea tekstinsyöttö (`InputCtl`) ja kalenterivalinta | `rt:machine` 21/21; React-jälki vielä nauhoittamatta |
| **S2 — kalenterin luonti** *(tehty)* | kalenterit | Tehty: `src/CalendarWizard.rgr` ajaa neljä askelta `StepperCtl`illä (lineaarinen, ei kierrä), portit laskettu lomakkeesta kuten komponentin `canGoNext` ja salasanan vahvuus samoilla viidellä säännöllä. Näkymä `/new-calendar` on oma sivunsa: 13 tyyppikorttia, kentät, salauskortti kytkimineen ja salasanakenttineen, esikatselu, 10 väriä, 3 näkyvyyttä. Luonti on työ, jonka vastaus lisää kalenterin seediin, valitsee sen ja avaa Kodin toastilla. `calendar-wizard` täsmää referenssiin 100 % joka ruudussa; salausportti on Ranger-puolen oma skenaario, koska alkuperäisen kytkin on roolittomana laatikkona | velhon askeleet ja validoinnit täsmäävät ✓ |
| **S3 — vuosisuunnitelma** | vuosi | `YearSheetPageV2` (1 926 r); ensin selvitys mitä `app-ranger/lib/yearsheet` (722 r) jo kattaa; `TableCtl` ja `EventCalCtl` valmiina | vuosinäkymän ruudukko ja valinnat täsmäävät |
| **S4 — suunnittelu** *(kone ja näkymä tehty)* | suunnittelu | Tehty: `planDialog.machine.json` (6 tilaa, 18 tapahtumaa) ajossa `gallery/statechart`illa, **108 solua ja 300 satunnaissarjaa lukkoaskeleessa oikean XStaten kanssa** (`rt:machine:live`). Ajonaikainen kone sai tyypitetyn kontekstin (`ScVal`), `setKey`-lausekkeen ja nimetyt hostin toiminnot. Näkymä: `src/PlanDialogHost.rgr` ajaa koneen sen omasta määrittelystä (kello ja `selectFetchedDaysForReplacement` hostilta, silmukka `send → pending → resume`), ja dashboardin *Suunnittele viikko* piirtää kaikki kuusi tilaa `CheckboxCtl`/`RadioGroupCtl`-kontrolleilla suoraan kontekstista. Kaksi skenaariota (`plan-week`, `plan-edit`) `rt:trace`-portissa, joka tarkistaa koneen tilan joka askeleen jälkeen. Jäljellä: oikea tekstinsyöttö (`InputCtl`) ohjeille ja palautteelle, React-jälki | kuusi tilaa ja niiden siirtymät täsmäävät ✓ · näkymä ajaa ne kaikki ✓ |
| **S5 — chat** *(kone ja näkymä tehty)* | keskustelu | Tehty: `chat.machine.json` (8 lehtitilaa kolmessa tasossa, 16 tapahtumaa) ajossa `gallery/statechart`illa, **96 solua ja 300 satunnaissarjaa lukkoaskeleessa oikean XStaten kanssa** (`rt:machine:live`), ja rakenne + guardien nimet diffattu oikeaa `chatMachine.ts`:ää vasten (`rt:machine:config`). Näkymä: `src/ChatHost.rgr` ajaa koneen määrittelystään ja hoitaa sen kuusi nimettyä toimintoa (host muistaa lähettämänsä tapahtuman, koska runner pitää nimet eikä tapahtumia); `RtChatSim` on `mockAdapter` kellolla — vastaus striimataan sana kerrallaan `STREAM_CHUNK`-tapahtumina ja päättyy `STREAM_COMPLETE`en, jonka toimintojen määrä (0/1/2 promptista) vie `reviewing`n kaikkiin kolmeen haaraan. Railin *Valmentaja*-näyttö piirtää transkriptin, striimin, toiminnot päätöksineen, tallennuksen ja virheen. Kolme skenaariota (`chat-single`, `chat-multi`, `chat-error`) `rt:trace`ssa. Jäljellä: oikea tekstinsyöttö, kuva oikeasti, React-jälki | streaming- ja review-tilat täsmäävät ✓ · näkymä ajaa kaikki 16 tapahtumaa ✓ |
| **S6 — storet** | kaikki | `appStore` (1 974 r) ja `activeWorkoutStore` (1 378 r) sen verran kuin näkymät vaativat — ei kokonaan | näkymät ajavat ilman React-storea |

Järjestys on **pienin kone ensin**: `addWorkoutDialog` on kolme tilaa ja seitsemän tapahtumaa,
ja se todistaa koneiston ennen kuin `planDialog`in kuusi tilaa tai chatin sisäkkäiset tilat
maksavat mitään. Sama logiikka kuin rivikerroksessa: L0 ensin, sitten renderöijä.

---

## 4. Riskit

| Riski | Vaikutus | Torjunta |
|-------|----------|----------|
| `DashboardPage.tsx` on 3 364 riviä ja isännöi kaiken | sivu kerrallaan porttaaminen ei onnistu | portataan **kone kerrallaan**; dashboard on viimeinen, ei ensimmäinen |
| Näissä näkymissä ei ole yhtään `data-testid`iä | jälki ei voi avautua testideihin | avaimena rooli + nimi (§2.2); se on myös se minkä EVG julkaisee |
| Benchmark vaatii Firebase-emulaattorit ja yksityisen frontendin | ei aja Ranger-repon CI:ssä | jälki nauhoitetaan ja committoidaan, kuten `oracle/expected.json` |
| Storet ovat 3 352 riviä yhdessä | portti paisuu rajattomasti | portataan vain se mitä kulloinenkin näkymä lukee; store ei ole vaihe vaan jäännös |
| `app-ranger/lib` (14 106 r) on jo osin portattu | sama työ tehdään kahdesti | jokaisen vaiheen ensimmäinen tehtävä on selvittää mitä sieltä voi käyttää |
| AI-vastaukset eivät ole deterministisiä | jälki ei voi täsmätä | `mockAdapter` molemmilla puolilla — se on jo olemassa React-puolella |

---

## 5. Mistä jatketaan

Järjestyksessä, ylimmäinen ensin. Jokainen kohta on kirjoitettu niin että sen voi ottaa
käteen tuntematta tätä istuntoa.

### 5.1 Referenssijälki *(tehty; näin se ajetaan uudestaan)*

Referenssi ajettiin tässä istunnossa: monorepo `../realtrainer`, emulaattorit
(`firebase emulators:start`, auth 9099, firestore 8080), frontend `vite --mode test`
portissa 5175 (`npm run build:ranger-lib` ensin — se hakee kääntäjän `../../Ranger`ista).
`scripts/record-reference-trace.mjs` tyhjentää emulaattorit, luo käyttäjän, syöttää
`fixtures/reference/seed.json`in Firestoreen REST-rajapinnalla, kirjautuu
`window.__testSignIn`illä, avaa reitin ja ajaa skenaariot roolilla ja nimellä.
Playwrightin selain: `PLAYWRIGHT_BROWSERS_PATH` osoittamaan asennukseen jonka revisio
täsmää `playwright-core`n kanssa.

```bash
npm run rt:trace:reference     # nauhoita referenssi (--only add-workout, --shots hakemisto)
npm run rt:trace:record        # nauhoita Ranger-puoli
npm run rt:trace:diff          # ruutu ruudulta; huonoin ruutu RT_TRACE_FLOOR (0.9) vastaan
```

Mitä diffi opetti on kirjattu `gallery/realtrainer/README.md`:n Traces-osioon: dialogien
paikka puussa, "Lisää"-lakana, palkin "Kalenteri" avaa tämän viikon, vahvistusaskeleen
"Viikko on tyhjä", chatin virhe lokissa, nimettömät ikoninapit. Kaksi ruutua jää
tarkoituksella alle sadan (muokkauslakanan paikka puussa, `creating`-tila) ja README
sanoo miksi.

### 5.2 S4:n ja S5:n näkymät

Molemmat näkymät on tehty (S4- ja S5-rivit yllä), samalla mallilla: kone luetaan
omasta tiedostostaan, host antaa kellon ja nimetyt toiminnot, näkymä piirtää
`state`n ja kontekstin eikä pidä omaa kopiota mistään, ja skenaario kulkee `rt:trace`n
läpi tila askeleittain tarkistettuna. Jäljellä:

1. **Tekstinsyöttö — tehty.** Kentät ovat `InputCtl`-instansseja EVG-puussa
   (`rt-chat-field`, `rt-plan-field`, `rt-add-field`, muokkauslakanan yleinen ja
   päiväkohtaiset kentät), nimettyinä placeholderin mukaan kuten alkuperäisen
   textareat. Jokainen muokkaus lähetetään koneelle ja kenttä asetetaan koneesta
   joka uudelleenrakennuksessa. Skenaarion `type`-askel kulkee niiden läpi.
   Selaimessa `web/main.js` kytkee `evg-textinput.js`-sillan; sen käyttö oikealla
   näppäimistöllä on katsottu vain ohjelmallisesti (`typeText`, `keyWith`).
2. **Kuva.** `SET_IMAGE` kantaa nyt tiedostonimen; oikea kuva on hostin asia.
3. **`CLOSE_REVIEW` ilman hyväksyttyjä** ja `REJECT_ALL` ovat koneessa ja napeissa
   mutta ei skenaarioissa; `rt:machine:live` kattaa ne solutasolla.

**Nimetyt toiminnot ovat hostin.** Kone nimeää `takeResponse`in ja `acceptAll`in, host
ajaa ne — ja runner **pysähtyy niin kauan kuin nimetty toiminto on velkaa**, koska
`reviewing` haarautuu sen täyttämän listan pituudesta. Näkymän silmukan on siis oltava
`send → aja pending → resume`, ei pelkkä `send`. `PlanDialogHost.settleHost` on se
silmukka; katso myös `gallery/statechart/README.md`.

### 5.3 S3, S6

S2 on tehty (taulukko yllä). `YearSheetPageV2` (1 926 r) kannattaa aloittaa
selvityksellä siitä mitä `app-ranger/lib/yearsheet` (722 r) jo kattaa; reitti on
`/yearsheet` ja `/yearsheet/:periodId`, ja nauhoitin ajaa sen samalla seedillä
(`ys-ref-1`, yksi jakso, kaksi malliviikkoa). S6:sta on jo se mitä näkymät ovat
vaatineet: seedissä on kalenterit omistajineen, valinta (`selectCalendar`) ja
lisäys (`addCalendar`) — `appStore`n `calendars`/`selectCalendar`/`addCalendar`
sen verran kuin S1, S2 ja S4 tarvitsivat.

### 5.4 Piirroksen luettavuus

`gallery/statechart` osaa piirtää koneen ja ajon siitä. Reititys on nyt yksi
reititin jokaiselle nuolelle (`gallery/rangerflow/layout/ReadableRouter.rgr`):
laatikoiden ympärillä suojavyöhyke, jokaiselle socketille oma lähtökaista, ja haku
joka maksaa risteyksistä, jaetuista käytävistä ja nimiöistä kaikkia jo piirrettyjä
reittejä vasten. `statechart:viz:check` pitää säännöt nollassa.
[`gallery/rangerflow/docs/PLAN_READABLE_ROUTING.md`](gallery/rangerflow/docs/PLAN_READABLE_ROUTING.md)
kertoo mikä on tehty ja mikä jäi: sivun valinta on yhä `faceEdges`, ja `chatMachine`
piirtyy kuudella risteyksellä.

## 6. Portit, ja mikä niistä vaatii mitä

| Portti | Vaatii | Mitä mittaa |
|--------|--------|-------------|
| `rt:compact` · `rt:l0` · `rt:coverage:check` | ei mitään | rivikerros oraakkelia vasten |
| `rt:machine` | `xstate` | 21 solua neljässä toteutuksessa + 400 satunnaissarjaa |
| `rt:machine:live` | `xstate` | planDialog 108 + chat 96 solua, 300 sarjaa kumpikin |
| `statechart:parity` | `xstate` | modulin omat koneet, ei sovelluskoodia |
| `statechart:viz:check` | — | piirros: laatikot, nuolet, portit, nimiöt |
| `rt:trace` | ei mitään | Ranger-jälki nauhoitettua vasten, ja koneen tila joka askeleen jälkeen skenaarion sanomaa vasten |
| `rt:machine:config` | **monorepo** | konfiguraatio oikeaa `.ts`:ää vasten |
| referenssinauhoitus | **monorepo + emulaattorit** | React-jälki |

Kaksi alinta poistuvat 0:lla ja sanovat miksi, kun lähteitä ei ole — ne eivät ole CI:ssä
mutta ne on tarkoitus ajaa koneella jolla ne toimivat.
