# PLAN — Fysiikkamoottorin arviointi ja uudistus

> **Status:** päätösdokumentti (arvio + suositus + vaiheistettu porttaussuunnitelma)
> **Kysymys:** Cannon.js on ihan kiva — pitäisikö vaihtaa modernimpaan moottoriin,
> jonka porttaisi pala palalta osaksi runkoa? Uudistus ei ole 100 % pakollinen;
> arvioidaan mitä puuttuu ja mitä siirrolla saisi.
> **Painopisteet (annettu):** 1) MIT-lisenssi 2) hyvät ominaisuudet 3) GitHubissa
> 4) järkevät unit-testit, jotta Ranger-portti voidaan tehdä hyvin.
> **Liittyvät:** [`IDEAL.md` §2.5](./IDEAL.md) (physics-seam), [`ROADMAP.md`](./ROADMAP.md),
> [`physics/src/`](./physics/src/) (nykyinen portti).

---

## 0. TL;DR

- **Nykyinen `physics/src/cannon_*.rgr` ei ole "kevyt Cannon" — se on _arcade-osajoukko_
  Cannonin API:n muotoisena.** Se osaa pallo–pallo- ja pallo–taso-törmäykset,
  Z-akselin pyörimisen ja käsin viritetyn impulssiratkaisijan (flipper-tweakit).
  Kaikki mikä tekee Cannonista _yleisen 3D-moottorin_ puuttuu: **oikea
  constraint-solver, nivelet (hinge/point-to-point/distance/spring), laatikko- ja
  konveksitörmäys, raycast, ajoneuvomalli, kitka, uni/islands, useammat muodot.**
- **Kieli ei ole rajaava tekijä — Ranger _emittoi_ C++:aa ja Rustia**, joten myös
  C++- ja Rust-moottorin lähdekoodin voi kääntää käsin `.rgr`:ksi ja se kääntyy takaisin
  C++/WASM/natiivi Pi:hin kuten muukin. **Jolt (MIT, C++) on siis pätevä
  porttauskohde**, ei pelkkä backend, ja Apache-2.0 (Rapier) on riittävän salliva
  porttaukseen. Oikea rajaava akseli on **porttauksen kustannus ja tarkkuus**, ei
  lisenssi tai kieli (ks. §3).
- **Suositus (kaksitasoinen):**
  1. **Porttauskohde nyt:** päivitä nykyinen portti **cannon-es**iin (MIT, TypeScript,
     ylläpidetty Cannon-forkki, **sama per-luokka-testisetti** jota portti jo peilaa).
     Tämä ei ole uudelleenkirjoitus vaan portin _loppuunsaattaminen_: tuodaan pala
     palalta ne moduulit jotka nykyportti jätti pois (solver → nivelet → laatikko/
     konveksi → raycast → ajoneuvo → muodot). Jokainen tulee `cannon_*.rgr` +
     `cannon_*_test.rgr` -parina, kuten tähänkin asti.
  2. **Jolt (MIT) on pätevä vaihtoehto — olit oikeassa.** Koska Ranger emittoi C++:aa,
     Joltin voi portata `.rgr`:ksi. Se on **modernein** ehdokas. Varaus: Joltin ydinarvo
     (SIMD-matikka + monisäie-job-system) **ei säily** yksisäikeisen skalaari-`.rgr`:n
     läpi (§3), joten saat Joltin _ominaisuudet_ muttet sen _nopeutta_, ja porttaustyö
     on ~5× cannon-es. Siksi Jolt sopii **joko** (a) myöhemmäksi täydeksi `.rgr`-portiksi
     jos halutaan modernein arkkitehtuuri / showcase, **tai** (b) host-natiiviksi
     backendiksi `PhysicsWorld`-rajapinnan (IDEAL §2.5) taakse desktop-3D:hen — silloin
     SIMD+säikeet säilyvät, mutta se ei aja Pi-terminaalissa.
- **"Ei pakko" pitää paikkansa:** jos pelit pysyvät pinball/top-down-tasolla,
  nykyportti riittää. Uudistus kannattaa **heti kun tarvitaan** nivelet (oikeat
  flipperit), raycast (FPS/valinta/näkölinja), ajoneuvot (autopeli 3D), tai staattinen
  tasogeometria (trimesh/heightfield). Nämä eivät ole nykyportissa saavutettavissa
  ilman uusia moduuleja.

---

## 1. Mitä nykyinen "Cannon-portti" oikeasti on

Portissa on 30 `.rgr`-moduulia (~4 200 riviä) testeineen: `Vec3`, `Quaternion`,
`Mat3`, `AABB`, `Box`, `Sphere`, `Plane`, `Shape`, `Body`, `World`, `Broadphase`,
`NaiveBroadphase`, `Narrowphase`, `ContactEquation`, `ContactMaterial`, `Material`,
`ArrayCollisionMatrix`, `TupleDictionary`, `OverlapKeeper`, `Transform`. Matematiikka-
ja tietorakennetaso on **aidosti Cannon** ja hyvin testattu.

Mutta simulaatioydin on **arcade-osajoukko**, ei Cannon-solver. Konkreettisesti
([`cannon_world.rgr`](./physics/src/cannon_world.rgr),
[`cannon_narrowphase.rgr`](./physics/src/cannon_narrowphase.rgr),
[`cannon_body.rgr`](./physics/src/cannon_body.rgr)):

| Cannonin oikea toteutus | Nykyportti | Seuraus |
|--------------------------|------------|---------|
| **`GSSolver`** (Gauss–Seidel, `Equation`-lista, iteraatiot) | Käsin kirjoitettu `resolveContactImpulses()` + pinball-tweakit (`e=1.05` kinemaattiselle flipperille, `applyKinematicSpinTransfer` × 0.65, penetraation erottelu käsin) | Ei pinojen vakautta, ei niveliä, ei kitkaa — vain kimmoisa törmäysvaste |
| **Narrowphase: kaikki muotoparit** (box-box, sphere-box, convex, particle…) | Vain `sphereSphere` + `spherePlane`; `dispatchShapePair` palauttaa muille `false` | `CannonBox` on olemassa mutta **laatikkotörmäys ei koskaan synny** |
| **Täysi 3D-rotaatio** (inertiatensori, `updateInertiaWorld`) | `clampAngularVelocity` nollaa X/Y — vain **Z-pyörintä**; `updateInertiaWorld` on tyhjä | Käytännössä 2D-simulaatio XY-tasossa Z-spinillä, ei 3D-jäykkä kappale |
| **Constraints** (PointToPoint, Hinge, Distance, Lock, ConeTwist, Spring) | — | Ei niveliä; flipperi on kinemaattinen kikka, ei hinge-constraint |
| **`FrictionEquation` + kitka** | Vain `restitution` | Ei tangentiaalista kitkaa; `ContactMaterial.friction` jää käyttämättä |
| **Ray / raycast** (`Ray`, `RaycastResult`, `world.raycastClosest/Any/All`) | — | Ei näkölinjaa, ei valintaa, ei raycast-ajoneuvoa |
| **`RaycastVehicle` / `RigidVehicle` / `WheelInfo`** | — | Ei ajoneuvomallia |
| **Muodot: `Cylinder`, `ConvexPolyhedron`, `Heightfield`, `Trimesh`, `Particle`** | — | Ei sylinteriä, ei konveksia, ei maastoa, ei staattista trimesh-tasoa |
| **Broadphase: `SAPBroadphase`, `GridBroadphase`** | Vain `NaiveBroadphase` (O(n²)) | Ei skaalaudu satoihin kappaleisiin |
| **Uni / islands (`sleepState`, `Island`)** | Kentät olemassa, käyttämättä | Ei lepotilaoptimointia |
| **CCD (continuous collision)** | — | Nopea pieni kappale (pinball-pallo) voi tunneloitua seinän läpi |

**Johtopäätös:** nykyportti on _tarkoituksella_ minimaalinen pinballiin (ROADMAP
rivi 181: "yksi universaali fysiikkamoottori" on ei-tavoite, kaksi kerrosta
tarkoituksella). Se on **oikea valinta nykypeleille**, mutta se ei ole "kevyt Cannon"
josta kasvaa iso Cannon lisäämällä nappuloita — iso osa Cannonista puuttuu kokonaan.

---

## 2. Vaihtoehdot painopisteitä vasten

Koska Ranger emittoi C++/Rust/ES6:ta, **mikä tahansa luokkamallinen moottori on
periaatteessa portattavissa** — kieli ei suodata. Ratkaisevaa on **porttauksen
kustannus ja tarkkuus**: kuinka moni kielipiirre kääntyy suoraan `.rgr`:ään ja kuinka
paljon moottorin arvosta säilyy Rangerin läpi (ks. §3 SIMD/säikeet).

| Moottori | Lisenssi | Lähdekieli | Portattavuus `.rgr`:ksi | Unit-testit | Ulottuvuus | Huom |
|----------|----------|-----------|:-----------------------:|-------------|-----------|------|
| **cannon-es** (pmndrs) | **MIT** ✅ | **TypeScript** | ✅ **helppo** — sama arkkitehtuuri kuin nyt, ~20 moduulia jo portattu | ✅ Cannonin per-luokka-setti | 3D | Ylläpito hiipunut, mutta **feature-complete & vakaa** = ihanteellinen _stabiili_ porttauskohde |
| **Jolt** (jrouwe) | **MIT** ✅ | C++ | ⚠️ **työläs** — templatet/SIMD/job-system eivät mäppäydy (§3) | ✅ (C++, oma framework) | 3D | **Modernein & rikkain** (character controller, ajoneuvot, CCD, kaikki nivelet). Portattava, mutta ~5× koodi ja perf-etu katoaa skalaariksi |
| **Rapier** (dimforge) | Apache-2.0 (OK porttiin) | Rust | ⚠️ työläs — nalgebra-generics/SIMD/ownership | ✅ (Rust) | 2D/3D | Moderni, deterministinen, CCD; sama SIMD/perf-tappio kuin Jolt portattuna |
| **OimoPhysics** (saharan) | MIT | Haxe → JS/TS | ⚠️ osin (Haxe/generoitu JS) | ⚠️ ohuet | 3D | Modernimpi solver + 6-DoF-nivelet; heikompi testikattavuus |
| **Planck.js** (piqnt) | MIT | TypeScript | ✅ helppo | ✅ hyvät (Box2D-perua) | **2D** | Box2D-portti: erinomainen solver + nivelet; **luopuisi 3D-Cannon-investoinnista** |
| **p2.js** (Cannonin tekijä) | MIT | JavaScript | ✅ helppo | ✅ on | **2D** | Sama tekijä kuin Cannon; 2D, ylläpito hiipunut |
| **Box2D v3** (Erin Catto) | MIT | C | ⚠️ ei luokkamalli | ✅ | 2D | Referenssilaatu, mutta ei sovi luokkapohjaiseen porttiin |
| **Ammo.js** (Bullet) | zlib | C++ (emscripten) | ❌ generoitu emscripten-JS | — | 3D | Ylläpitämätön, läpinäkymätön |
| Oimo.js (lo-th) | MIT | JS | ✅ | ⚠️ | 3D | Ei aktiivista kehitystä ~2016 jälkeen |

**Suodatuksen tulos:** lisenssi ei enää pudota ketään (MIT: cannon-es/Jolt/Oimo/Planck/p2;
Apache-2.0 Rapier riittää porttiin). Kaksi todellista kärkiehdokasta jäävät jäljelle,
ja ne edustavat **eri strategiaa**:
- **cannon-es** — *halpa, tarkka, nopea voitto*: sama arkkitehtuuri, ~20 moduulia jo
  portattu, per-luokka-testit (`test/Vec3.js`, `test/Body.js`, `test/RaycastVehicle.js` …)
  mäppäytyvät suoraan olemassa olevaan [`cannon_test_harness.rgr`](./physics/src/cannon_test_harness.rgr):iin.
- **Jolt** — *modernein moottori, iso investointi*: MIT ja portattava (olit oikeassa),
  mutta ~5× koodi ja sen ydinarvo (SIMD-matikka + monisäie-job-system) ei säily Rangerin
  läpi (§3). Saat Joltin _ominaisuudet_ muttet Joltin _nopeutta_.

---

## 3. Kustannus & tarkkuus: Jolt vs. cannon-es porttauskohteena

Korjaus edelliseen: **Jolt _ei_ ole diskattu.** C++ kääntyy `.rgr`:stä, joten Joltin
lähteen voi portata ja se palaa C++:ksi/WASM:ksi/Pi:ksi. Kysymys ei ole *voiko*, vaan
*kannattaako* — ja vastaus riippuu siitä, kuinka paljon moottorin arvosta säilyy portin
läpi.

**Mikä Joltista säilyy Rangerin läpi ja mikä ei.** Joltin ydinarvo on kaksi asiaa,
jotka `.rgr` **ei** ilmaise:

| Joltin nopeuden lähde | Säilyykö `.rgr`-portissa? | Miksi |
|-----------------------|:-------------------------:|-------|
| **SIMD-matikka** (`Vec4`/`Mat44` SSE/NEON-intrinsiceillä) | ❌ | `.rgr`:ssä ei ole SIMD-primitiivejä; matikka kääntyy skalaariksi |
| **Monisäie-job-system** (broadphase, solver rinnakkain) | ❌ | Rangerin runtime/WASM-malli on **yksisäikeinen**, RC-pohjainen |
| **Templatet** (geneerinen muoto-dispatch käännösaikana) | ⚠️ | `.rgr`:ssä ei generic-templateja → dispatch käsin, koodi paisuu |
| Custom-allokaattorit / temp-arenat | ⚠️ | `.rgr` käyttää RC-kekoa; arenat kirjoitetaan uusiksi |
| **Algoritmit** (solver, quadtree-broadphase, CCD, character controller) | ✅ | Nämä kääntyvät — tämä on se osa jonka portista saa |

Eli **`.rgr`-Jolt = Joltin ominaisuudet skalaarinopeudella.** Saat modernin featuresetin
(character controller, ajoneuvot, CCD, kaikki nivelet, quadtree-broadphase), muttet sitä
"2× Rapier" -nopeutta joka on koko Joltin maine — se nopeus tulee juuri SIMD:stä ja
monisäikeisyydestä, jotka jäävät oven ulkopuolelle.

**Kolme argumenttia miksi cannon-es on silti parempi _ensimmäinen_ kohde:**

1. **Kohdealusta on Raspberry Pi -yksisäie.** Ranger-lupaus on ajaa Pi-terminaalissa.
   Jolt on suunniteltu monisäie-desktop/konsoli-raudalle; skalaari-yksisäie-portti
   kadottaa sen suunnitteluoletukset. cannon-es:n **kevyt skalaari-arkkitehtuuri sopii
   Rangerin ajoympäristöön luontaisesti** — se on halvin siellä missä koodi oikeasti ajaa.
2. **Nolla-hukkainvestointi + testit.** `Vec3/Quaternion/Mat3/AABB/Body/World` (~20
   moduulia) **kelpaavat sellaisinaan** — cannon-es on saman koodin TS-siisti, bugikorjattu
   versio. Migraatio on _lisäystä_. Ja Cannonin per-luokka-testit mäppäytyvät suoraan
   [`cannon_test_harness.rgr`](./physics/src/cannon_test_harness.rgr):iin (painopiste #4).
   Jolt aloittaisi ~nollasta eri matikkakonventioilla ja C++-testiframeworkilla.
3. **IDEAL on jo suunniteltu monimoottoriseksi.** [`IDEAL.md` §2.5](./IDEAL.md) haluaa
   `PhysicsWorld`-rajapinnan, jonka takana on *"arcade-ydin **tai** cannon-portti **tai**
   host-natiivi-moottori"*. **Tämä ei ole joko–tai:** cannon-es voi olla portattava,
   Pi-yhteensopiva oletusydin, ja Jolt voi tulla myöhemmin **joko** (a) omana `.rgr`-
   porttina jos halutaan modernein arkkitehtuuri **tai** (b) host-natiivina backendinä
   desktopille (silloin SIMD+säikeet säilyvät, mutta ei aja Pi:llä).

**Missä Jolt voittaisi:** jos tavoite on nimenomaan **modernein moottori showcase-
mielessä** (Ranger on osin kielilaboratorio — "Ranger porttasi Joltin" on itsessään
näyttävä demonstraatio C++-porttauskyvystä), tai jos tarvitaan Joltin ainutlaatuisia
kykyjä (character controller, edistyneet nivelet, soft bodies) joita cannon-es:ssä ei
ole. Silloin Jolt on perusteltu — kunhan hyväksytään ~5× porttaustyö ja skalaarinopeus.

---

## 4. Mitä siirto konkreettisesti antaa (mapattuna Ranger-peleihin)

| Uusi kyky (cannon-es) | Puuttuu nyt | Mikä Ranger-peli hyötyy |
|-----------------------|:-----------:|--------------------------|
| **`GSSolver` + `Equation`/`FrictionEquation`** | ✅ | Pinball/sandbox: vakaat pinot, aito kitka, kappaleet eivät läpäise |
| **`HingeConstraint`** | ✅ | **Flipperit oikeana nivelenä** kinemaattisen kikan sijaan; ovet, kammet |
| **`PointToPoint`/`Distance`/`Spring`** | ✅ | Ketjut, heilurit, jouset, ragdoll, kytketyt kappaleet |
| **Laatikko- ja konveksitörmäys (box-box, `ConvexPolyhedron`)** | ✅ | Laatikkopinot, kolikot, ei-pallomaiset esineet (nyt kaikki on pallo tai taso) |
| **`Ray` / `world.raycast*`** | ✅ | FPS (`fps_wasm`), hiirivalinta, näkölinja, laserit, maadoitustesti |
| **`RaycastVehicle` + `WheelInfo`** | ✅ | **Autopeli 3D:nä** oikealla renkas­mallilla (nyt top-down host-physics) |
| **`Cylinder`** | ✅ | Tynnyrit, pylväät, renkaat |
| **`Heightfield`** | ✅ | Maasto/rata korkeuskarttana |
| **`Trimesh`** | ✅ | Staattinen tasogeometria mielivaltaisesta meshistä |
| **`SAPBroadphase` + islands/sleep** | ✅ | Sadat kappaleet ilman O(n²)-romahdusta; lepäävät kappaleet halvat |
| **CCD (jos portataan)** | ✅ | Nopea pinball-pallo ei tunneloidu seinän läpi |
| **Täysi 3D-inertia** | ✅ | Aidosti 3D pyörivät kappaleet (nyt vain Z) |

Tämä myös toteuttaa [`IDEAL.md` §2.5](./IDEAL.md):n toivelistan: muototyypit + suodatus
(layer/mask) + sensorit/triggerit + täysi kontaktimalli (begin/persist/end + syvyys +
tangentti-impulssi), jotka kaikki ovat cannon-es:ssä valmiina.

---

## 5. Vaiheistettu porttaussuunnitelma (pala palalta)

Periaate säilyy: **1 cannon-es-moduuli → 1 `cannon_*.rgr` + 1 `cannon_*_test.rgr`**,
`npm run engine:physics:test` vihreänä joka vaiheen jälkeen. Vaiheet on järjestetty
arvo/riski-suhteessa; jokainen on itsenäisesti hyödyllinen ja pysäytettävissä.

**Vaihe 0 — Perusta (ei toiminnallista muutosta).** Merkitse lähde cannon-es:ksi,
päivitä matikkamoduulit (`Vec3/Quaternion/Mat3`) cannon-es:n bugikorjauksiin, lisää
`Ray`-luuranko. Todiste: nykytestit vihreinä + uudet math-testit.

**Vaihe 1 — Oikea solver (suurin arvo).** Porttaa `Equation`, `ContactEquation`
(täysi), `FrictionEquation`, `GSSolver`. Kytke `CannonWorld.step` käyttämään solveria
_uuden rajapinnan takana_, säilytä nykyinen arcade-resolveri `config`-lipulla, jottei
pinball hajoa. Todiste: pino-vakaus-testi + pinball-regressio.

**Vaihe 2 — Nivelet.** `Constraint` → `PointToPointConstraint` → `HingeConstraint` →
`DistanceConstraint` → `LockConstraint` → `Spring`. Muunna flipperi hinge-nivelellä
ohjatuksi (poistaa `applyKinematicSpinTransfer`-kikan). Todiste: heiluri- ja
flipperi-testi.

**Vaihe 3 — Laatikko/konveksi-narrowphase.** `boxBox`, `sphereBox`, `ConvexPolyhedron`
+ `convexConvex` (SAT). Todiste: laatikkopino-testi.

**Vaihe 4 — Raycast.** `Ray`, `RaycastResult`, `world.raycastClosest/Any/All`,
muotojen `raycast`-metodit. Todiste: raycast-osumatestit per muoto.

**Vaihe 5 — Ajoneuvo.** `WheelInfo` + `RaycastVehicle`. Todiste: autopeli-ajotesti.

**Vaihe 6 — Muodot + broadphase + uni.** `Cylinder`, `Heightfield`, `Trimesh`,
`Particle`; `SAPBroadphase`; islands/sleep. Todiste: per-muoto-testit + skaalaustesti.

**Vaihe 7 — Rajapinta & backend-luukku.** Nosta `PhysicsWorld`-rajapinta (IDEAL §2.5)
ja tarjoa valinnainen **Jolt/Rapier host-natiivi-backend** desktopille rajapinnan
takana. Ranger-cannon-es on oletus; natiivi-backend opt-in raskaaseen 3D:hen.

Kunkin vaiheen voi tehdä erillisenä PR:nä; **uudistus voi pysähtyä minne tahansa** ja
jättää edellisen vaiheen tuotantoon.

---

## 6. Päätöspisteet (tarvitsen sinulta suunnan)

1. **Moottorivalinta — pääkysymys:**
   - **A) cannon-es (suositus):** halpa, tarkka, Pi-yhteensopiva, reuse ~20 moduulia,
     testit mäppäytyvät. Nopein tie ominaisuuksiin.
   - **B) Jolt täytenä `.rgr`-porttina:** modernein arkkitehtuuri + showcase Rangerin
     C++-porttauskyvystä; hyväksytään ~5× työ ja skalaarinopeus (ei SIMD/säikeitä).
   - **C) Molemmat:** cannon-es portattava Pi-ydin **ja** Jolt host-natiivi-backend
     desktopille `PhysicsWorld`-rajapinnan takana.
2. **Aikataulu:** aloitetaanko heti valitun moottorin Vaihe 1 (solver), vai jätetäänkö
   suunnitelma odottamaan kunnes peli oikeasti tarvitsee niveliä/raycastia/ajoneuvoja?
3. **Pinball-riski:** solverin vaihto voi muuttaa flipperin tuntumaa. OK säilyttää
   vanha arcade-resolveri lipun takana (suositus), vai siirrytäänkö suoraan
   hinge-niveliin?

---

## Lähteet

- cannon-es (MIT, TypeScript, muodot + RaycastVehicle + Trimesh/Heightfield/ConvexPolyhedron):
  <https://github.com/pmndrs/cannon-es>
- Rapier (Apache-2.0, Rust→WASM): <https://github.com/dimforge/rapier>
- Jolt Physics (MIT, C++→WASM): <https://github.com/jrouwe/JoltPhysics> ·
  JS-portti <https://github.com/jrouwe/JoltPhysics.js>
- Planck.js (MIT, TS, Box2D-portti): <https://github.com/piqnt/planck.js>
- OimoPhysics (MIT, Haxe→JS/TS): <https://github.com/saharan/OimoPhysics>
- Three.js Resources — Best Physics: <https://threejsresources.com/best/physics>
