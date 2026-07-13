# Ranger2D — striimaava spatiaalinen maailma (grid · culling · kamera-prefetch · rinnakkainen asset-loader)

> **Tila:** suunnitelma (heinäkuu 2026). **Ei vielä toteutettu.**
> **Rakentuu:** [`PLAN_RANGER2D.md`](./PLAN_RANGER2D.md) R1b:n (ortho-Camera2D + 4×4 viewProj) päälle.
> **Liittyvät:** [`ROADMAP.md`](./ROADMAP.md), [`RENDERING_EVG.md`](./RENDERING_EVG.md),
> [`scripting/game_camera.rgr`](./scripting/game_camera.rgr),
> [`scripting/game_entity_store.rgr`](./scripting/game_entity_store.rgr),
> [`scripting/game_image_loader.rgr`](./scripting/game_image_loader.rgr).
> **Tavoite:** kamera liikkuu isossa dynaamisessa maailmassa; ruudun ulkopuoliset objektit
> clipataan; solut ja niiden assetit **preloadataan sen mukaan minne kamera on menossa**;
> raskas assettien decode tapahtuu **rinnakkaisella WASM-worker-threadilla** ilman että frame
> tökkii. Pelilogiikka pysyy deterministisenä.

---

## 0. Tiivistelmä

Käyttäjän linjaus: iso maailma, jossa on esim. **100×100 pää-grid** ja kunkin solun alla jopa
**~500 spriteä** (staattisia tai dynaamisia) joihin kamera voi mennä. Näitä **ei materialisoida
etukäteen** — solu herää eloon vasta kun kamera lähestyy sitä, ja **nukahtaa** kun kamera loittonee.
Peli määrittää maailman koon (**oletus 1×1** = yksi ruutu, jolloin koko järjestelmä on no-op ja
nykyiset pelit renderöityvät bittiin asti samoin). Asset-loader on **erillinen WASM-moduli** joka
lataa/dekoodaa toisessa threadissa ja syöttää valmiit resurssit host-enginelle.

Neljä osaa, jokainen erillinen de-riskattu vaihe:

1. **`WorldGrid` + kaksitasoinen culling** (puhdas Ranger, ei threadeja) — S1.
2. **Solun elinkaari + kamera-residenssirengas** (herätys/nukutus, aluksi synkroninen lataus) — S2.
3. **Rinnakkainen decode-worker + `RGL1`-ABI** (decode off-thread, GL-upload render-threadilla) — S3.
4. **Suunta-tietoinen prefetch + web-Worker-backend** — S4.
5. **Dynaamisten entiteettien simulaatiosäde + determinismivartija** — S5.

Kaksi kantavaa linjausta:

- **Grid on *indeksi* olemassa olevan `worldEntities`-mallin päälle, ei uusi maailma.**
  Solutus (bucket by x,y) ja culling ovat lisäkerros nykyisen `syncEntity`-silmukan
  ([`game_entity_store.rgr`](./scripting/game_entity_store.rgr) ~177–230) ympärillä.
- **Loader noudattaa RGW1/RGU1:n todistettua ABI-muotoa** (kiinteä lohko + `ptr()/size()/revision()`),
  ei ad-hoc-viestijonoa. Uusi lohko + uudet exportit + uusi magic → puhtaasti additiivinen
  (`PLAN_RANGER2D.md` §11b vektori D).

---

## 1. Nykytila (mihin tämä kiinnittyy)

| Osa-alue | Nykytila | Sijainti |
|----------|----------|----------|
| Maailman entiteetit | ✅ `worldEntities` EvalValue-map `id → {x,y,visible,active,…}` | [`game_runtime.rgr`](./scripting/game_runtime.rgr) ~886–955 |
| Kamera-offset per entiteetti | ✅ `syncEntity` vähentää `camX/camY`, kirjoittaa screen-poseen | [`game_entity_store.rgr`](./scripting/game_entity_store.rgr) ~177 |
| **Culling** | ❌ **ei mitään** — joka frame kaikki `worldEntities` synkataan | — |
| Maailman koko | ⚠️ vain `worldHeight` + physiikan `setWorldSize(w,h)`; ei 2D-gridiä | [`game_runtime.rgr`](./scripting/game_runtime.rgr) ~720–784 |
| Kamera | ✅ world→screen-offset (`game_camera`), **+ R1b GPU-ortho-camera** (pan/zoom/rot) | [`game_camera.rgr`](./scripting/game_camera.rgr), [`gfx_sdl.rgr`](./gfx_sdl.rgr) R1b |
| Asset-lataus | ⚠️ **synkroninen** decode + path-cache, frame-polulla | [`game_image_loader.rgr`](./scripting/game_image_loader.rgr) |
| Threadit | ❌ **nolla** thread-viittausta koko koodikannassa | — |
| Host-resurssikahvat | ✅ `rg_host_register_sheet/rect` palauttaa kahvan (WASM) | [`wasm/rust_autopeli/src/lib.rs`](./wasm/rust_autopeli/src/lib.rs) ~602–643 |
| WASM-ABI-malli | ✅ RGW1 world, RGU1 UI — kiinteä lohko + `ptr/size/revision` | [`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr), [`wasm_ui_io.rgr`](./scripting/wasm_ui_io.rgr) |

**Puuttuu:** 2D-maailmagrid, per-solu elinkaari, kamera-vetoinen preload/free, per-objekti- ja
per-solu-culling, ja asynkroninen (thread-erotettu) asset-decode. Tämä dokumentti kattaa ne.

---

## 2. Koordinaatti- ja maailmamalli

```
world(cols, rows)            ; oletus (1, 1) — yksi solu = koko pane, järjestelmä no-op
  cellW, cellH               ; solun koko maailmapikseleinä (oletus = pane w,h)
  → maailma = cols*cellW  ×  rows*cellH  maailmapikseliä
```

- **Solu** on maailman pienin striimattava/culled-yksikkö. `100×100`-grid = 10 000 solua.
- Solu **ei omista 500 valmista entiteettiä** — se omistaa **halvan kuvauksen** (spawn-descriptor +
  asset-manifesti). 500 entiteettiä *materialisoidaan* vasta PRELOAD-vaiheessa (§4). Näin
  100×100×500 = 5 M potentiaalista entiteettiä ei koskaan ole muistissa yhtä aikaa — vain
  residenssirenkaan solut (muutama × 500).
- **Authoring** (kaksi tapaa, kartoituksen `entities()`-mallin jatkona):
  - *staattinen*: peli listaa entiteetit maailmakoordinaateissa; grid bucketoi ne soluihin `x,y`:n
    perusteella (ei pelin tarvitse tietää soluista).
  - *provider*: peli antaa callbackin `cell(cx, cy) → { assets:[...], spawn:[...] }`, jota kutsutaan
    solun herätessä. Tämä on se malli jolla "500 spriteä per solu" skaalautuu laiskasti.
- **Taaksepäin-yhteensopivuus:** ilman `world()`-kutsua maailma on `1×1`, kaikki entiteetit ovat
  ainoassa solussa, culling ei koskaan hylkää mitään → **nykyiset pelit muuttumattomia** (golden-frame
  -turva, `PLAN_RANGER2D.md` §11b vektori A).

---

## 3. Kaksitasoinen culling (object clipping)

Kamera-AABB maailmapikseleinä = `[camX, camX+paneW] × [camY, camY+paneH]`, laajennettuna
`margin`-reunuksella (oletus ½ solu, ettei reunalla vilku).

```
Karkea (solutaso):   iteroi vain solut jotka leikkaavat kamera-AABB:tä (+margin).
                     100×100 gridistä käydään läpi ~muutama solu, ei 10 000.
Hieno (objektitaso): kullekin ehdokas-entiteetille AABB vs. kamera-view-rect;
                     täysin ruudun ulkopuolinen → skip ennen syncPose/piirtoa.
```

**Kiinnityskohta:** [`game_entity_store.rgr`](./scripting/game_entity_store.rgr) `syncEntity`
lukee nyt `worldEntities[id]`:n ja kirjoittaa screen-posen **jokaiselle**. S1 lisää tähän
reject-testin: laske entiteetin maailma-AABB (`x,y,w,h`), jos ei leikkaa view-rectiä → merkitse
`visible=false` / ohita `renderGpuSprite`/`syncPose`. Determinismi säilyy: culling koskee vain
*renderöintiä ja synkkausta*, ei pelilogiikan tilaa.

**No-op 1×1:ssä:** kun `cols*cellW ≤ paneW` ja `rows*cellH ≤ paneH`, view-rect kattaa koko maailman
→ mikään ei koskaan hylkäydy → identtinen nykyisen kanssa.

---

## 4. Solun elinkaari ja kamera-residenssirengas

```
DORMANT ──(kamera preload-säteelle)──▶ PRELOADING ──(assetit valmiit + entiteetit luotu)──▶ READY
   ▲                                                                                          │
   │                                                                            (kamera active-säteelle)
   └──────────────(kamera poistuu retire-säteen ulkopuolelle)──── RETIRING ◀── ACTIVE ◀───────┘
```

Kamera-solu `(ccx, ccy) = floor(cam / cellSize)`. Kolme sädettä (solua), pelin säädettävissä:

| Rengas | Säde (oletus) | Solun tila | Mitä tehdään |
|--------|---------------|-----------|--------------|
| **Active** | 1 | ACTIVE | päivitetään (dynaamiset simuloidaan) + renderöidään + culled |
| **Preload** | 2 | PRELOADING→READY | assetit ladataan (worker), entiteetit materialisoidaan; **ei vielä päivitetä** |
| **Retire** | 3 | RETIRING→DORMANT | assetit + entiteetit vapautetaan (hystereesi estää vilkun reunalla) |

- **Hystereesi:** herätys preload-säteellä, vapautus vasta retire-säteen *ulkopuolella* (retire > preload)
  → kamera voi heilua solurajalla ilman lataa/vapauta-ryöppyä.
- **Materialisointi PRELOAD:ssa, ei ACTIVE:ssa** → kun kamera saapuu soluun, entiteetit + tekstuurit
  ovat jo valmiina (ei frame-piikkiä). Tämä on "preloadata assetteja joihin ollaan siirtymässä".
- **Vapautus** palauttaa entiteetit poolille ja **dekrementoi tekstuurikahvan refcountin**; jaettuja
  atlaksia ei pureta jos toinen elävä solu vielä käyttää niitä.

### 4b. Suunta-tietoinen prefetch (S4)

Preload-rengas **venytetään kameran nopeuden suuntaan**: lataa kauemmas edestä kuin takaa. Kamera
liikkuu jo `game_camera`-nopeudella (`leadMs`/`follow`-entiteetin `vy`); käytä samaa vektoria
biasoimaan preload-AABB:tä (esim. `+2` solua liikesuuntaan, `+1` sivuille, `0` taakse). Näin nopeasti
ajava peli ehtii latautua ennen kuin solu on ruudulla.

---

## 5. Rinnakkainen asset-loader — `RGL1` decode-worker

**Ongelma:** `GameImageLoader` dekoodaa PNG/JPEG synkronisesti frame-polulla → iso solunvaihto
tökkäisi. **Ratkaisu:** siirrä *decode* toiselle threadille; pidä *GL-upload* render-threadilla
(GL-konteksti on thread-sidottu — tekstuuria ei voi ladata worker-threadista).

```
Render/main thread                         Loader worker thread (WASM-moduli)
──────────────────                         ──────────────────────────────────
solu → PRELOADING                          
  postaa load-jobin (cellId, asset-path) ─▶ ottaa jobin
                                             lukee tiedoston / bufferin
  ... jatkaa framea ...                      dekoodaa PNG/JPEG → raaka RGBA + w,h
                                             merkitsee done-jonoon
poimii done-jonon:                        ◀─ (valmis RGBA jaetussa muistissa)
  glTexImage2D(RGBA) render-threadilla       
  rekisteröi u64 TextureId (R5-rekisteri)    
  solu → READY                               
```

- **Työn- ja valmis-jonot** ovat kiinteitä lohkoja jaetussa lineaarimuistissa,
  **RGW1/RGU1-mallin mukaan**: header + record-taulukot, `rg_load_jobs_ptr()/size()`,
  `rg_load_done_ptr()/size()/revision()`. Host bulk-lukee done-jonon, kohtelee **untrusted**-datana,
  validoi jokaisen offsetin/koon/id:n ennen `glTexImage2D`:ta. Magic `RGL1` = `0x314C4752`.
- **Vain decode on rinnakkaista.** GL-upload (halpa) pysyy render-threadilla → ei GL-kontekstin
  jakamista, ei ajastusongelmia. Tämä on standardi "decode off-thread, upload on GL thread" -jako.
- **Kaksois-/rengaspuskuri** decodattujen RGBA-bufferien siirtoon, ettei worker ja host kiistele
  samasta muistista; revision-gate (kuten RGU1) kertoo hostille milloin uusi valmis erä on luettavissa.

### 5b. Thread-backendit operaattoritasolla

Ranger-operaattorilla on target-templatet (kuten `gfx_*`):

| Target | "toinen threadi" | Toteutus |
|--------|------------------|----------|
| `cpp` (natiivi/Pi) | `SDL_Thread` tai `std::thread` | worker-silmukka + `SDL_mutex`/atomit jonoille |
| `es6` (web) | Web Worker | `postMessage` + `createImageBitmap` (decode off-main-thread) |
| muut (LLVM) | — | synkroninen fallback (no-op thread, lataa suoraan) — determinismille turvallinen |

Julkinen Ranger-API on sama; vain backend vaihtuu. es6-web saa "toisen threadin" ilmaiseksi
Web Workerilla + `createImageBitmap`illa (selain dekoodaa pääthreadin ulkopuolella).

---

## 6. Determinismi ja simulaatiosäde (S5)

Culling ja striimaus saavat vaikuttaa **vain renderöintiin ja resurssien elinaikaan**, ei
pelilogiikan lopputulokseen (`PLAN_RANGER2D.md` §7, §11b vektori G).

- **Staattiset entiteetit** (koristeet, seinät): jäätyvät kun solu on DORMANT — ei simulaatiota, ei
  vaikutusta logiikkaan. Turvallista.
- **Dynaamiset entiteetit** (viholliset, AI, fysiikka): jos ne pitää simuloida myös ruudun
  ulkopuolella, tarvitaan **erillinen simulaatiosäde ≥ render-säde**. Kaksi vaihtoehtoa, pelin
  valittavissa per entiteetti:
  - *freeze off-screen*: dynaaminen entiteetti jäätyy DORMANT-solussa (halpa; sopii "resetoituvalle"
    sisällölle).
  - *coarse off-screen tick*: simuloi karkealla askeleella suuremmalla sim-säteellä (kalliimpi;
    säilyttää AI-tilan). **Fixed-point / int-logiikka** pysyy, joten sim-tulos on sama riippumatta
    siitä oliko solu ruudulla — cross-target-determinismi (Mac↔Pi, es6↔natiivi) säilyy.
- **Sääntö:** render-float (Transform2D double, R1b) ei koskaan syötä logiikkaan; striimauspäätökset
  (mikä solu ladataan) eivät saa haaroittaa pelin RNG:tä eivätkä step-järjestystä.

---

## 7. Kerrosarkkitehtuuri (mihin osat istuvat)

```
Peli:  world(cols,rows) · cell(cx,cy)->{assets,spawn} · entiteetit maailmakoordinaateissa
                       │
┌──────────────────────▼───────────────────────────────────────────────┐
│ WorldGrid (puhdas Ranger)                                             │
│  bucket worldEntities → solut · cells-in-AABB · residenssirengas       │
│  solun elinkaari (DORMANT/PRELOAD/ACTIVE/RETIRE) · culling-testit       │
└───────┬───────────────────────────────────────┬───────────────────────┘
        │ culled näkyvät entiteetit               │ load/free-pyynnöt (cellId, manifesti)
┌───────▼──────────────────┐          ┌───────────▼───────────────────────┐
│ Render (R1b GPU-camera)  │          │ AssetStreamer                      │
│  syncEntity + cull        │          │  RGL1 job/done-jonot · u64-kahvat  │
│  gfx_gpu_camera_set        │          │  ┌─ decode worker thread (WASM) ─┐ │
│  batched quads             │          │  │  PNG/JPEG → RGBA (off-frame)   │ │
└────────────────────────────┘          │  └────────────────────────────────┘ │
                                         │  GL-upload render-threadilla → R5    │
                                         └──────────────────────────────────────┘
```

`WorldGrid` on portable (ei `write`/`present`/thread-kutsuja). `AssetStreamer`in worker-osa on
backend (thread-operaattorit target-templateilla). R1b:n `gfx_gpu_camera_set` on jo se mekanismi
jolla kamera liikkuu — tämä dokumentti antaa sille *maailman* jossa liikkua.

---

## 8. Vaiheistus (de-riskattu: culling ensin, threadit viimeisenä)

| # | Vaihe | Sisältö | Validointi | Riski |
|---|-------|---------|-----------|-------|
| **S1** | WorldGrid + culling | `world(cols,rows)` (oletus 1×1); bucket `worldEntities` soluihin; solu-AABB + objekti-AABB cull `syncEntity`-silmukassa | 1×1 = byte-identtinen (golden-frame vihreä); iso maailma: vain kamera-AABB:n entiteetit synkataan (laskuri) | matala (puhdas Ranger, no-op oletuksena) |

### S1 — toteutuksen tila (heinäkuu 2026): ✅ **objektitason culling valmis**

Toteutettu ja verifioitu [`scripting/game_world_grid.rgr`](./scripting/game_world_grid.rgr) +
kytkentä [`game_entity_store.rgr`](./scripting/game_entity_store.rgr) `syncEntity`:yn ja
[`game_runtime.rgr`](./scripting/game_runtime.rgr) `config().world`-parsintaan.

- **Peli-API:** `config().world = { cols, rows, cellW?, cellH?, cull: true, cullMargin? }`. `cull`
  on opt-in; ilman sitä grid pysyy 1×1 ja culling on tiukka no-op.
- **Hieno culling (objektitaso) valmis:** `WorldGrid.cullsEntity` hylkää entiteetin joka on
  selvästi kamera-view-rectin (`[camX..camX+pw]×[camY..camY+ph]`) ulkopuolella, laajennettuna
  `cullMargin + max(w,h)`:llä (konservatiivinen — isoa spriteä ei koskaan cullata vahingossa).
  `syncEntity` early-returnaa (`e.visible=false`) ennen per-entiteetti-työtä.
- **Karkea culling (solutaso) — AVOIN:** `cellCol/cellRow/worldW/worldH` ovat paikallaan S2:n
  pohjaksi, mutta render-silmukka iteroi yhä koko `entities`-listan (per-entiteetti-reject). Solu-AABB:n
  yli iterointi (vain kamera-AABB:n solut) tulee S2:ssa solun elinkaaren kanssa.
- **Verifioitu:** Ranger→cpp linkittyy natiiviksi (WorldGrid + cullsEntity generoitu); headless
  pong/invaders/breakout ajavat muuttumattomina; `game-engine-render` golden-frame **byte-identtinen**;
  13-kohtainen `cullsEntity`-yksikkötesti es6:lla (disabled=no-op, in-view, edge-margin, far-cull,
  kamera-relatiivinen pan, iso-sprite-suoja, solumatikka) → `ALL_OK`.
| **S2** | Solun elinkaari + rengas | DORMANT/PRELOAD/ACTIVE-kone; kamera-solu + hystereesi; **synkroninen** lataus (ei threadeja vielä); provider-callback `cell(cx,cy)` | headless: kamera kulkee gridin poikki, solut heräävät/nukahtavat oikeilla säteillä (lokitesti) | matala–keski |
| **S3** | Rinnakkainen decode | `RGL1` job/done-ABI; decode `std::thread`/`SDL_Thread`illa; GL-upload render-threadilla; refcount-vapautus | natiivi: iso solunvaihto ei pudota FPS:ää (profiili); `RANGER_STREAM_ASYNC=0` = synkroninen fallback (bisect) | **keski–korkea** (threadit, GL-thread-raja) |
| **S4** | Suunta-prefetch + web | preload-AABB biasoitu nopeudella; `es6` Web Worker + `createImageBitmap` | nopea kamera: solu valmis ennen ruutua; web-parity | keski |
| **S5** | Sim-säde + determinismi | erillinen sim- vs render-säde; off-screen coarse tick; determinismivartija | cross-target hash (Mac↔Pi↔es6) sama striimauksesta riippumatta | keski |

**S1 tuottaa heti hyödyn** (culling isolle maailmalle) puhtaana Rangerina ilman threadeja.
S3 on ainoa aidosti epävarma osa (thread + GL-raja) ja se on eristetty oman flaginsa taakse.

---

## 9. Regressioriski ja mitigointi

Sama additiivinen linja kuin `PLAN_RANGER2D.md` §11b:

| # | Vektori | Mitigointi |
|---|---------|-----------|
| A | **Golden-frame** (`game-engine-render.test.ts`) | `world()` oletus 1×1 → culling ei koskaan hylkää → oletuspolku byte-identtinen. Iso maailma on opt-in |
| B | **`syncEntity`-silmukka** (kaikki pelit) | cull-testi on *lisä-reject* ennen synkkausta; ilman `world()`:ia view-rect kattaa maailman → ei muutosta. Aja `game-runner.test.ts` |
| C | **Asset-lataus muille kuluttajille** | `GameImageLoader`in synkroninen API säilyy; `AssetStreamer` on **uusi rinnakkainen luokka**, ei mutatoi loaderia. PDF/PNG/HTML-putki (evg-työkalut) koskematon |
| D | **WASM-silta** | `RGL1` = uusi lohko + uudet exportit + uusi magic → additiivinen (kuten RGS1). RGW1/RGU1 koskematta. Magic-vakiot yhdestä lähteestä (R0) |
| E | **Threadit / dataraces** | Vain decode rinnakkaista; GL-upload + logiikka pysyvät main-threadilla. `RANGER_STREAM_ASYNC=0` = synkroninen fallback → thread-bugin voi bisectata pois ilman uudelleenkäännöstä |
| F | **Determinismi** | Striimaus ei haaroita RNG:tä/step-järjestystä; sim-tulos riippumaton solun näkyvyydestä (§6). Cross-target-hash-testi vartioi |

---

## 10. Avoimet päätökset

1. **Solun koko:** sidottu pane-kokoon (yksinkertainen) vai pelin vapaasti säädettävä `cellW/cellH`
   (joustava, mutta cull-margin monimutkaistuu)? **Suositus:** oletus = pane, override sallittu.
2. **Authoring:** staattinen entiteettilista (grid bucketoi) vai provider-callback `cell(cx,cy)`
   vai molemmat? **Suositus:** molemmat — lista pieniin, provider "500/solu"-skaalaan.
3. **Dynaamisten off-screen-käytös:** freeze vs. coarse-tick oletuksena? **Suositus:** freeze oletus,
   coarse-tick opt-in per entiteetti (halvempi + deterministisempi lähtökohta).
4. **RGL1-jonon koko / sivutus:** kuinka monta yhtäaikaista load-jobia (RGU1 = 64 nodea / 8 KB)?
   Iso solunvaihto voi jonottaa satoja assetteja → jonon koko + prioriteetti (näkyvät solut ensin).
5. **Loaderin sijainti:** ~~aito erillinen WASM-moduli vai host-thread joka kutsuu WASM-decodea?~~
   **PÄÄTETTY (heinäkuu 2026):** host-thread ajaa decoden — natiivilla `std::thread`/`SDL_Thread`,
   webillä Web Worker; WASM-moduli on decode-payload jota thread kutsuu. Sama koodi toimii myös ilman
   WASM:ia (LLVM-fallback). Yksinkertaisin GL-threadraja (decode off-thread, upload main-threadilla).
6. **Fysiikka (Cannon) striimauksessa:** luodaanko/poistetaanko bodyt solun elinkaaren mukaan?
   Sitoutuu `PLAN_RANGER2D.md` §8 `RigidBodyLink`-identiteettiin — body syntyy solun PRELOAD:ssa.

---

## 11. Ei-tavoitteet (tämä iteraatio)

- Ääretön proseduraalinen maailma / Perlin-generointi — grid on äärellinen `cols×rows`; provider
  voi generoida solun sisällön, mutta gridin koko on määrätty.
- Level-of-detail-mip-ketjut / etäisyys-LOD — 2D-ortho-kamerassa koko ei riipu syvyydestä (§4 plan);
  LOD tulee vasta 3D:n myötä.
- Verkkostriimaus (moninpeli) — loader lataa paikallisista/paketoiduista asseteista.
- GL-kontekstin jakaminen usealle threadille — tietoisesti vältetty (decode off-thread, upload
  main-threadilla, §5).

---

## 12. Yhteenveto

Kamera (R1b) saa **maailman jossa liikkua**: äärellinen `cols×rows`-grid (oletus 1×1, jolloin kaikki
on no-op ja nykypelit muuttumattomia), jonka päälle tulee **kaksitasoinen culling**, **kamera-vetoinen
solujen herätys/nukutus hystereesillä ja suunta-prefetchillä**, sekä **rinnakkainen decode-worker**
(RGL1-ABI, RGW1/RGU1:n muotoa noudattaen) joka dekoodaa assetit frame-polun ulkopuolella ja jättää
halvan GL-uploadin render-threadille. Vaiheistus alkaa puhtaasta Ranger-cullingista (S1, matala riski,
välitön hyöty) ja eristää threadit viimeisiin, flagattuihin vaiheisiin. Kaikki additiivista — vanha
software- ja GPU-polku pysyvät koskemattomina kunnes parity on todistettu.
