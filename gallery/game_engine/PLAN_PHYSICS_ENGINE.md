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
- **Ranger-filosofia rajaa vaihtoehdot rajusti.** Moottori _portataan lähdekoodina_
  `.rgr`:ksi (kääntyy C++/WASM/ES6/natiivi Pi). Siksi **Rust- ja C++-moottorit
  (Rapier, Jolt, Ammo, Box2D-C) eivät kelpaa porttauskohteeksi** — niitä voi käyttää
  vain läpinäkymättöminä host-natiivi-backendeinä, mikä rikkoo "write once → aja
  Pi:llä" -lupauksen. Vain **luettava, modulaarinen, hyvin testattu JS/TS-moottori**
  kelpaa portattavaksi.
- **Suositus (kaksitasoinen):**
  1. **Porttauskohde nyt:** päivitä nykyinen portti **cannon-es**iin (MIT, TypeScript,
     ylläpidetty Cannon-forkki, **sama per-luokka-testisetti** jota portti jo peilaa).
     Tämä ei ole uudelleenkirjoitus vaan portin _loppuunsaattaminen_: tuodaan pala
     palalta ne moduulit jotka nykyportti jätti pois (solver → nivelet → laatikko/
     konveksi → raycast → ajoneuvo → muodot). Jokainen tulee `cannon_*.rgr` +
     `cannon_*_test.rgr` -parina, kuten tähänkin asti.
  2. **Valinnainen tulevaisuuden pako-luukku:** salli **Jolt** (MIT) tai **Rapier**
     host-natiivina backendinä **`PhysicsWorld`-rajapinnan takana** (IDEAL §2.5)
     raskaaseen desktop-3D:hen — _ei_ portattuna vaan sidottuna. Pi/natiivi-buildit
     putoavat takaisin Ranger-cannon-es-ytimeen.
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

Ratkaiseva suodatin ei ole "paras moottori" vaan **"paras _portattava_ moottori"**:
lähdekoodi käännetään käsin `.rgr`:ksi, joten sen pitää olla luokkamallinen, riippuvuus-
kevyt ja per-moduuli-testattu JS/TS. Tämä pudottaa suorituskykykuninkaat (Rust/C++)
porttauskohteina — ne kelpaavat vain host-natiivi-backendiksi rajapinnan taakse.

| Moottori | Lisenssi | Lähdekieli | Portattava `.rgr`:ksi? | Unit-testit | Ulottuvuus | Huom |
|----------|----------|-----------|:----------------------:|-------------|-----------|------|
| **cannon-es** (pmndrs) | **MIT** ✅ | **TypeScript** | ✅ **kyllä** (sama arkkitehtuuri kuin nyt) | ✅ Cannonin per-luokka-setti | 3D | Ylläpito hiipunut, mutta **feature-complete & vakaa** = ihanteellinen _stabiili_ porttauskohde |
| **OimoPhysics** (saharan) | MIT | Haxe → JS/TS | ⚠️ osin (Haxe-lähde / generoitu JS kömpelömpi kääntää) | ⚠️ ohuet | 3D | Modernimpi solver + 6-DoF-nivelet; heikompi testikattavuus, Haxe-sukujuuri |
| **Planck.js** (piqnt) | MIT | TypeScript | ✅ kyllä | ✅ hyvät (Box2D-perua) | **2D** | Box2D-portti: erinomainen sequential-impulse-solver + nivelet; **luopuisi 3D-Cannon-investoinnista** |
| **p2.js** (Cannonin tekijä) | MIT | JavaScript | ✅ kyllä | ✅ on | **2D** | Sama tekijä kuin Cannon; 2D, ylläpito hiipunut |
| **Box2D v3** (Erin Catto) | MIT | **C** | ⚠️ ei luokkamalli; C lähellä C++-targettia mutta ei JS-testisynergiaa | ✅ | 2D | Referenssilaatu, mutta ei sovi luokkapohjaiseen porttiin |
| **Rapier** (dimforge) | **Apache-2.0** ❌ | **Rust → WASM** | ❌ **ei** | ✅ (Rust) | 2D/3D | Moderni, deterministinen, CCD — mutta **ei MIT** ja **ei portattava**; vain backend |
| **Jolt** (jrouwe) | **MIT** ✅ | **C++ → WASM** | ❌ **ei** | ✅ (C++) | 3D | Huippunopea (Horizon/Death Stranding), MIT — mutta **vain host-natiivi-backend**, ei portattava |
| **Ammo.js** (Bullet) | zlib | C++ (emscripten) | ❌ ei | — | 3D | Ylläpitämätön, läpinäkymätön WASM |
| Oimo.js (lo-th) | MIT | JS | ✅ | ⚠️ | 3D | Ei aktiivista kehitystä ~2016 jälkeen |

**Suodatuksen tulos:**
- **Priori­teetti #1 (MIT):** pudottaa Rapierin (Apache-2.0).
- **Priori­teetti #4 (hyvät unit-testit portin tueksi) + porttausvaatimus:** nostaa
  **cannon-es**in kärkeen — sillä on juuri se per-luokka-QUnit-rakenne (`test/Vec3.js`,
  `test/Quaternion.js`, `test/Body.js`, `test/RaycastVehicle.js` …) jota portti jo
  peilaa. Testit portataan kuten lähde: `cannon_*_test.rgr`.
- **Jolt** on ainoa "moderni + MIT" joka jää eloon — mutta C++, joten se on **backend-
  vaihtoehto**, ei porttauskohde.

---

## 3. Miksi cannon-es eikä "jotain uudempaa"

Houkutus on ottaa Rapier/Jolt, koska ne ovat suorituskyvyltään ja determinismiltään
edellä. Mutta se olisi **eri asia kuin mitä tehtävä pyytää**:

1. **Porttausfilosofia.** Ranger-lupaus on _lähdekoodin_ siirrettävyys (yksi
   `.rgr` → C++/WASM/ES6/natiivi Pi). Rust/C++-moottori voi elää vain esikäännettynä
   WASM/natiivi-binäärinä → Pi-terminaalibuild ja "write once" hajoaa. cannon-es
   kääntyy Rangerin läpi samoihin targetteihin kuin muu peli.
2. **Testit porttausapuna (#4).** cannon-es tuo Cannonin testisetin mukanaan.
   Jokainen portattu moduuli saa heti oraakkelin: aja sama testi `.rgr`:nä, vertaa
   lukuja. Rust/C++-testejä ei voi peilata `.rgr`-harnessiin ([`cannon_test_harness.rgr`](./physics/src/cannon_test_harness.rgr)).
3. **Nolla-hukkainvestoiniti.** Nykyiset `Vec3/Quaternion/Mat3/AABB/Body/World`-portit
   **kelpaavat sellaisenaan** — cannon-es on saman koodin TypeScript-siisti, bugikorjattu
   versio. Migraatio on _lisäystä_, ei purkua. Rapier/Jolt heittäisi kaiken pois.
4. **IDEAL on jo suunniteltu tähän.** [`IDEAL.md` §2.5](./IDEAL.md) haluaa
   `PhysicsWorld`-rajapinnan (`addBody`/`setBounds`/`step`/`contacts`), jonka takana on
   *"arcade-ydin **tai** cannon-portti **tai** host-natiivi-moottori"*. Suositus toteuttaa
   juuri tämän: cannon-es on portattava ydin, Jolt/Rapier valinnainen natiivi-backend.

**Milloin Jolt/Rapier -backend kannattaa:** vasta kun desktop-3D-peli tarvitsee satoja
törmääviä kappaleita, CCD:tä tai deterministista verkkopeliä — ja hyväksytään ettei se
peli aja Pi-terminaalissa. Se on _lisäys rajapinnan taakse_, ei ytimen korvaus.

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

1. **Aikataulu:** aloitetaanko heti Vaihe 1 (solver), vai jätetäänkö tämä suunnitelma
   pöytäkirjaan kunnes joku peli oikeasti tarvitsee niveliä/raycastia/ajoneuvoja?
2. **Laajuus:** riittääkö "täydennä cannon-es -portti" (suositus), vai haluatko myös
   Vaihe 7:n Jolt-backendin desktop-3D:tä varten heti?
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
