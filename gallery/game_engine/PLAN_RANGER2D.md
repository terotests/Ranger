# Ranger2D — PixiJS-tyylinen GPU-2D-renderöijä (3D-kelpoinen ydin)

> **Tila:** suunnitelma (heinäkuu 2026). **Ei vielä toteutettu.**
> **Liittyvät dokumentit:** [`ROADMAP.md`](./ROADMAP.md), [`RENDERING_EVG.md`](./RENDERING_EVG.md),
> [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md), [RGU1 WASM UI ABI -muistiinpano].
> **Tavoite:** julkinen 2D-API PixiJS-parity­tavoitteella (MIT-referenssi), sisäisesti
> 3D-kelpoinen render-ydin (4×4, ortho→perspektiivi, syvyys), joka ei lukkiudu 2D:hen.

---

## 0. Tiivistelmä

Rangerissa on jo **kypsä software-2D-pino** (SoftCanvas + EVG-vektorirasteroija), **retained
flat sprite -lista** ([`game_sprite.rgr`](./scripting/game_sprite.rgr)), **natiivi SDL2/GLES2
present-polku shadereineen** ([`gfx_sdl.rgr`](./gfx_sdl.rgr)), **Cannon.js-portti**
([`physics/src/`](./physics/src/)) ja **kaksi vakiintunutta WASM-ABI:a** (RGW1 world/physics,
RGU1 UI). Puuttuu **batchattu teksturoitu-quad-renderöijä, 2D-kamera/projektiomatriisi,
retained GPU-scene-graph konkatenoiduilla transformeilla ja atlas-packeri.**

Ranger2D **ei ole uusi erillinen moottori** vaan yksi `Ranger Render Core`, jonka päälle tulee
yksinkertainen 2D-API. Se rakentaa juuri sen vaikean GPU-infran, jota myöhempi 3D joka
tapauksessa tarvitsee, ja testaa retained scene-ABI:n (RGS1) sekä id-mallin.

Kaksi keskeistä linjausta jotka poikkeavat naiivista Pixi-kloonauksesta:

1. **WASM-scene-ABI (RGS1) on retained-dokumentti, ei imperatiivinen komentopuskuri.** Se
   noudattaa RGU1:n todistettua muotoa (kiinteä lineaarilohko + `ptr()/size()/revision()`
   -triadi, host bulk-kopioi & validoi), ei `CREATE_SPRITE`/`requestId → ObjectCreated`
   -asynkronista kättelyä.
2. **Fysiikkasidonta on identiteetti, ei haku.** Scene-entiteetin vakaa id **on** Cannon-bodyn
   id; Transform2D syötetään bodyn poseesta joka frame — kuten pelit jo tekevät
   ([`game_cannon_physics.rgr`](./scripting/game_cannon_physics.rgr)), mutta nyt formalisoituna.

---

## 1. Nykytila (mihin tämä kiinnittyy)

Perustuu kahteen koodikartoitukseen (render-pino + WASM-ABI, heinäkuu 2026).

| Osa-alue | Nykytila | Sijainti |
|----------|----------|----------|
| Software-framebuffer (RGBA8888) | ✅ `SoftCanvas` (`init/clear/fillRect/blitImage/raw`) | [`framebuffer.rgr`](./framebuffer.rgr) |
| Alpha-blit | ✅ `RgbaFastBlit` | [`rgba_fast_blit.rgr`](./rgba_fast_blit.rgr) |
| Retained sprite -lista | ✅ litteä `GameEntity` (`kind` rect/circle/wedge/ghost/bitmap/sheet) | [`game_sprite.rgr`](./scripting/game_sprite.rgr) |
| EVG-vektorirasteroija (CPU) | ✅ shapes/gradientit/varjot/SVG-path/TTF/flexbox → RGBA | [`../pdf_writer/src/raster/`](../pdf_writer/src/raster/) |
| EVG scene/element -puu | ✅ `EVGElement` parent/child + flexbox (UI-dokumentti, ei GPU-display-list) | [`../evg/EVGElement.rgr`](../evg/EVGElement.rgr) |
| Natiivi present + GLES2 | ✅ shaderit, VBO, full-frame-teksture, rotatoidut quadit | [`gfx_sdl.rgr`](./gfx_sdl.rgr) |
| GPU sprite-quad (atlas + rotaatio) | ⚠️ `gfx_gpu_sprites_begin/push/end` — **ei batchattu**, 1 draw call / sprite | `gfx_sdl.rgr` (~630–645, 1012–1100, 1545–1553) |
| GPU partikkelit | ✅ **batchattu** — yksi `glDrawArrays` per jono, additive | `gfx_sdl.rgr` (~918–960) |
| Kuvanlataus + cache | ✅ `GameImageLoader` (PNG/JPEG decode) | [`game_image_loader.rgr`](./scripting/game_image_loader.rgr) |
| Cannon.js-portti | ✅ vec3/quaternion/box/sphere/plane/world/narrowphase | [`physics/src/`](./physics/src/) |
| Peli↔fysiikka-sidonta | ✅ string-id join, parallel arrays, pose-writeback | [`game_cannon_physics.rgr`](./scripting/game_cannon_physics.rgr) |
| WASM world/physics ABI | ✅ RGW1 kiinteä lohko (magic `0x31574752`) | [`wasm/rust_autopeli/src/lib.rs`](./wasm/rust_autopeli/src/lib.rs) |
| WASM UI ABI (retained doc) | ✅ RGU1 (magic `0x31554752`) → EVG-puu | [`wasm/rust_autopeli/src/ui.rs`](./wasm/rust_autopeli/src/ui.rs), [`wasm_ui_io.rgr`](./scripting/wasm_ui_io.rgr) |

**Puuttuu Pixi-parityyn:** batchattu quad-renderöijä, 2D-kamera/projektio + Transform→4×4,
retained GPU display-list konkatenoiduilla transformeilla, atlas-packeri, WebGL `es6`-targetille
(nyt vain `putImageData` CPU-puskurista), RGS1 scene-ABI (ei ole olemassa),
u64-resurssikahvat (nyt kaikki string-id tai pieni int-koodi).

---

## 2. Kerrosarkkitehtuuri

```
┌─ Ranger Game API (yksinkertainen 2D) ─────────────────────────────┐
│  Container2D  Sprite2D  Graphics2D  Text2D  Mesh2D  Camera2D       │
│  scene.sprite(id).position(x,y).texture(t).layer(n)                │
└───────────────────────────┬───────────────────────────────────────┘
                            │  (retained: Transform2D + SpriteRenderer -komponentit)
┌───────────────────────────▼───────────────────────────────────────┐
│  Ranger Render Core (3D-kelpoinen)                                 │
│  Transform2D/Transform3D → 4×4 · RenderItem{geo,mat,M,layer,key}   │
│  geometry/material/texture -rekisterit (u64 id) · atlas            │
│  ortho/persp-projektio · depth · batching · cull · sort            │
└───────────────────────────┬───────────────────────────────────────┘
                            │  gfx_gpu_* / gl_* operaattorit
┌───────────────────────────▼───────────────────────────────────────┐
│  GPU backend                                                       │
│  natiivi: SDL2 + GLES2 (gfx_sdl.rgr)   ·   web: WebGL (es6, uusi)  │
└────────────────────────────────────────────────────────────────────┘
```

**Kova sääntö säilyy** (`ROADMAP.md`): jos tiedosto kutsuu `write`/`poll_keypress`/`gfx_present`,
se on backend; kaikki muu on portable. Render Core on portable; GPU-operaattoreilla on
`cpp`/`es6`/`ranger`-templatet kuten `gfx_*`-perheellä nyt.

Julkinen API näyttää objektipohjaiselta mutta ytimessä se on **komponenttidataa** (Transform2D +
SpriteRenderer), joten samaan id:hen voi myöhemmin liittää Mesh3D:n, RigidBodyn tai valon ilman
uutta oliotyyppiä.

---

## 3. Transform-malli (vaihtoehto B: 2D ja 3D erikseen)

Kaksi transform-tyyppiä, molemmat muuntuvat lopulta 4×4:ksi Render Coressa.

```
Transform2D                    Transform3D (myöhemmin)
  x, y            (double)       position:  Vec3
  rotation        (double)       rotation:  Quaternion
  scaleX, scaleY  (double)       scale:     Vec3
  skewX, skewY    (double)
  pivotX, pivotY  (double)       Billboard = 3D-position + 2D-sprite (myöhemmin)
  anchorX, anchorY(double)
  → localMatrix 4×4 (Z = layer/depth)
```

Perustelu: Pixi-tyylisessä 2D:ssä skew/anchor/pivot/pikselikoordinaatit ovat hyödyllisiä eikä
niitä kannata pakottaa quaternioniin. Sprite piirtyy XY-tasossa, `Z = layer`, ortho-kamera →
kuva näyttää täysin 2D:ltä mutta käyttää samaa 4×4-polkua kuin tuleva 3D.

**Huom:** nykyinen `GameEntity` käyttää `int x/y` + `angleDeg:double`. Transform2D siirtyy
`double`-koordinaatteihin renderöinnissä, mutta **pelilogiikka pysyy determinstisenä
(int/kiinteä)** — float on vain presentaatiodetalji, ei syötä takaisin logiikkaan
(`RENDERING_EVG.md` §7). Vanha `int`-polku pysyy taaksepäin yhteensopivana.

---

## 4. Ortho-kamera, syvyys ja layerit

```
Camera2D → OrthographicCamera
  ei perspektiiviä: objektin koko ei riipu syvyydestä
  z-layerit:  background z=-10 · world z=0 · foreground z=+10 · HUD erillinen passi
```

Mahdollistaa jo 2D-enginessä: oikea depth-testaus, kameran kallistus (myöhemmin),
parallax syvyyden perusteella, 2.5D-tasot, spritejen ja 3D-meshien sekoitus, perspektiivikameran
lisäys myöhemmin (`camera.projection = perspective`). Kamera korvaa/yleistää nykyisen
2D-world→screen-offset-kameran ([`game_camera.rgr`](./scripting/game_camera.rgr)).

---

## 5. Resurssit ja id-malli

Kartoitus vahvisti: tänään **ei ole yhtään u64-opaque-kahvaa** — kaikki on string-id tai pieni
int-koodi. Ranger2D ottaa käyttöön **kaksitasoisen id-mallin**:

| Id-laji | Kuka allokoi | Elinkaari | Tyyppi |
|---------|--------------|-----------|--------|
| `TextureId`, `AtlasId`, `GeometryId`, `MaterialId` | **host** | harvat, rekisteröidään latausvaiheessa | `u64` |
| Scene-entiteetin `EntityId` | **guest / peli** | tuhansia, vakaa koko elinajan | `u64` (tai vakaa string, ks. alla) |

- **Resurssit host-allokoituja:** host lataa PNG:n/atlaksen ja palauttaa vakaan `u64`-id:n.
  Laajentaa nykyistä `rg_host_register_sheet`/`rg_host_register_rect` -mekanismia
  ([`lib.rs`](./wasm/rust_autopeli/src/lib.rs) ~600–623), joka nyt palauttaa string-id:n.
- **Scene-entiteetit guestin omistamia:** guest antaa vakaan id:n, host mappaa sen paikalliseen
  `RenderObject`:iin. **Ei asynkronista host-allokointia, ei requestId/ObjectCreated-kättelyä.**
  Tämä on suoraan "EntityID 100 → local RenderObject / u64-handle" -malli ilman kaksivaiheista
  luontia.

> **Valinta:** u64 on suositus *resursseille* (harvat, host-omisteiset). Scene-entiteeteille u64
> on suositeltava yhtenäisyyden vuoksi, mutta vakaa string-id (kuten nyt `"p1"`, `"trafficCar"`)
> kelpaa myös — se on jo koko fysiikka/render-sidonnan liitosavain (§8). **Suositus:** siirrä
> resurssit u64:ään heti; scene-entiteeteillä salli sekä u64 että string-id join-avaimena
> (u64 sisäisenä, string valinnaisena debug-nimenä).

**Keskitä magic/version-vakiot yhteen lähteeseen.** Kartoitus löysi oikean bugin: RGW1/RGU1
magic-tarkistukset ovat epäjohdonmukaiset tiedostojen välillä
([`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr) vs [`wasm_ui_io.rgr`](./scripting/wasm_ui_io.rgr)),
ja RGU1-layout elää käsin kolmena kopiona (`ui.rs`, `ui.ts`, `wasm_ui_io.rgr`). RGS1:lle:
**yksi jaettu vakiolähde tai koodigeneraattori** (guest + host samasta lähteestä).

---

## 6. RenderItem ja batching (ydin — rakenna olemassa olevan quad-polun päälle)

Vaikka V1 piirtää vain spritejä, sisäinen render-komento on heti yleinen:

```
RenderItem
  entityId    u64
  geometryId  u64   (sprite = jaettu unit-quad)
  materialId  u64   (sprite material + textureId + blend)
  worldMatrix 4×4
  layer/z     int/double
  sortKey     u64   (koottu: layer<<48 | material<<16 | textureLayer)
  bounds      (cull)
```

Sprite: `geometryId = shared unit quad`, `materialId = sprite material + texture`,
`worldMatrix = Transform2D→4×4`. 3D-mesh myöhemmin käyttää **täsmälleen samaa** rakennetta.

**Batching-strategia (Pixi-enginen ydin):**

```
N Sprite2D-objektia
  → järjestä sortKey (material/texture/layer)
  → täytä instance-/vertex-buffer (yksi unit-quad, per-instance: M, uv-rect, tint)
  → muutama draw call (yksi per material/atlas-vaihto)
```

**Konkreettinen etu Rangerissa:** GLES2-shim tekee jo rotatoidun atlas-quadin
(`gfx_gpu_sprites_push`: `texId, atlasW/H, sx,sy,sw,sh, px,py, dw,dh, angleDeg, usePivot`), ja
**partikkelipolku on jo malliesimerkki batchatusta draw callista** samassa tiedostossa
(`rgfx_particles_draw_queue`, yksi `glDrawArrays`). V1:n GPU-työ on siis:
**(a) yleistä sprite-jono batchatuksi** (partikkelipolun tapaan, per-instance-atribuutit) ja
**(b) lisää vertex-shaderiin kamera×world 4×4** (nyt rotaatio lasketaan per-quad).

V1:n tehtävälista: texture atlas + packer · sprite batching (instancing / dynaaminen
vertex-buffer) · blend-mode-ryhmitys · scissor/mask · render texture · camera projection · culling
· sortKey.

---

## 7. Scene graph (retained, Pixi-tyylinen)

```
DisplayObject (Render Coren entiteetti, ei jaettu host-olio)
├── Container2D   (transform propagoituu lapsiin, alpha kertautuu)
├── Sprite2D
├── Graphics2D
├── Text2D
└── Mesh2D
```

Jokaisella: `entityId`, `parentId`, `children`, `visible`, `alpha`, `localMatrix`, `worldMatrix`,
`layer/zIndex`, `bounds`, `renderFlags`. Renderöijä käy puun läpi laskien world-transformit,
näkyvyyden, cullauksen ja renderöintijärjestyksen — kuten Pixin scene graph.

**Ranger-erityispiirre:** `DisplayObject` on **komponenttidataa** (Transform2D + SpriteRenderer),
ei jäykkä luokkahierarkia. Ei `Sprite → AnimatedSprite → PhysicsSprite` -periytymistä; sen sijaan
samaan `entityId`:hen liitetään komponentteja (Transform2D, SpriteRenderer, Animation, RigidBody,
ScriptBinding). Julkinen API voi näyttää objektipohjaiselta (`scene.sprite(id).position(...)`)
mutta alla se on komponenttidataa. Näin sama id saa myöhemmin 3D-renderöinnin tai fysiikan ilman
uutta oliotyyppiä.

Nykyinen litteä `GameEntity`-lista säilyy V1:ssä toimivana (retained-mode toimii jo); Container2D
+ konkatenoidut transformit ovat lisäkerros, ei korvaus.

---

## 8. Fysiikkaintegraatio (Cannon) — identiteettisidonta

**Nykytila jonka formalisoimme:** [`game_cannon_physics.rgr`](./scripting/game_cannon_physics.rgr)
pitää body-indeksoituja rinnakkaistaulukoita (`entityIds:[string]`, `entityAngles`, `entityKinds`);
`CannonWorld.bodies[i]` vastaa `entityIds[i]`:tä; törmäykset kantavat `bodyId`/`targetId` string-id:nä
(`CannonPhysicsCollision`); joka frame runtime lukee `body.position.x/y` + kulman spriten poseksi.
Liitosavain on **jaettu vakaa id** fysiikkabodyn ja visuaalisen entiteetin välillä.

**Ranger2D:n linjaus: sidonta on identiteetti, ei haku.**

```
EntityId 100
├── Transform2D      ← syötetään bodyn poseesta joka frame
├── SpriteRenderer   (textureId, atlas-frame, tint)
└── RigidBodyLink    → CannonBody (sama id 100)
```

- Scene-entiteetin `EntityId` **on** Cannon-bodyn id. Ei erillistä `spriteId ↔ bodyId`
  -mappaustaulukkoa — sama id molemmissa.
- **Pose-writeback formalisoituna:** fysiikkastep kirjoittaa `body.position → Transform2D.{x,y}`
  ja `bodyn Z-akselin kulma → Transform2D.rotation`. Yksi kohta, ei per-peli-boilerplatea.
- **"2D under the hood 3D" tulee ilmaiseksi:** Cannon on jo 3D (Vec3 + Quaternion). 2.5D:ssä
  lukitse Z, salli X/Y-liike, rotaatio vain Z-akselin ympäri — Render Coren ortho-kamera näyttää
  tuloksen 2D:nä. Sama koodi tukee myöhemmin oikeaa 3D:tä (perspektiivikamera + Mesh3D samaan id:hen).
- **Törmäykset id:llä:** `RigidBodyLink` tarjoaa `onContact(otherId, impact, point, normal)` —
  suoraan `CannonPhysicsCollision.bodyId/targetId`-mallista.

> **Rajaus (säilyy ROADMAPista):** ei yhtä universaalia fysiikkamoottoria. Cannon (3D, 2.5D-lukittu)
> ja host-2D-top-down ([`game_physics.rgr`](./scripting/game_physics.rgr)) pysyvät erillisinä
> kerroksina; molemmat tarjoavat saman `RigidBodyLink`-sidonnan Transform2D:hen. Ei pakoteta
> 3D-fysiikkaa kaikkeen 2D-fysiikkaan.

**WASM-polku:** RGW1 jakaa jo body-poset ja kontaktit guestin ja hostin välillä (autopeli). RGS1
scene-doc (§9) viittaa samaan `EntityId`:hen, joten fysiikka (RGW1) ja visuaalit (RGS1) sidotaan
id:llä myös WASM-rajan yli — kuten autopeli jo tekee string-id:llä.

---

## 9. RGS1 — retained scene-ABI (RGU1:n muotoa noudattaen)

Uusi WASM-scene-ABI täyttää kartoituksen paljastaman aukon (maailma piirretään nyt host-puolella
string-id `WasmVisualEntity`-listalla, ei guestin kirjoittamasta lohkosta). **RGS1 on RGU1:n
kaltainen retained-dokumentti**, ei komentopuskuri.

**Vakiintunut kuvio jota RGS1 noudattaa (RGW1/RGU1):**

1. Kiinteä-/arena-layout jaetussa lineaarimuistissa (header + kiinteät record-taulukot tunnetuilla
   offseteilla), **ei opcodeja / komentojonoa**.
2. 4-tavuinen little-endian magic + major/minor offsetissa 0. RGS1 = `0x31534752` (`'RGS1'`).
3. Guest omistaa & kirjoittaa; host bulk-kopioi lohkon ulos WASM-muistista, kohtelee
   **untrusted**-datana ja validoi jokaisen offsetin/countin/id:n ennen käyttöä.
4. **Revision-gated:** guest bumppaa `revision`:ia vain kun sisältö muuttuu; host ohittaa
   uudelleenluvun jos frame on identtinen (kuten RGU1 `revisionChanged`).
5. **Kolme export-funktiota:** `rg_scene_ptr()`, `rg_scene_size()`, `rg_scene_revision()`
   (RGU1:n `rg_ui_ptr/size/revision`-triadin peilaus).

**Luonnos-layout (mukaillen RGU1 node/prop/string-arenaa):**

```
Header (offset 0)
  magic=0x31534752 · major/minor · revision · cameraId
  nodeOffset/nodeCount · resTableOffset/resCount · stringOffset/stringSize · flags

SceneNode[]  (kiinteä koko, esim. 48 B)
  entityId (u64) · parentId (u64) · kind (u16: SPRITE/CONTAINER/TEXT/MESH)
  flags (visible/…) · layer (i32)
  Transform2D: x,y,rotation,scaleX,scaleY (pakattu fixed-point tai f32)
  SpriteRenderer: textureId/atlasId (u64) · frameOrUvRect · tint (RGBA8) · alpha

ResourceRef[]  (guestin näkemät resurssit → host-u64-id:t, rekisteröity up-front)
String table   (valinnaiset debug-nimet, Text2D-sisältö)
```

**Host-puolen lukija** mallinnetaan `WasmUiDoc` + `WasmUiEvgBuilder`
([`wasm_ui_io.rgr`](./scripting/wasm_ui_io.rgr)) mukaan: `SceneDoc.loadFromWasm(handle)` bulk-kopioi
+ validoi, ja `SceneDocRenderBuilder` kääntää litteän lohkon `RenderItem`-listaksi (world pass).

**Kaksi dokumenttia, samat periaatteet:**

```
RGS1 / scene doc   → maailman objektit (Sprite2D, Mesh2D, tilemap)  → RenderItem / GPU
RGU1 / UI doc      → HUD ja käyttöliittymä                          → EVG-puu
```

Molemmat: sama `EntityId/TextureId`, sama ptr/size/revision-triadi, sama validointimalli.

---

## 10. EVG-suhde: kaksi passia, yksi GL-konteksti

Pidä EVG ja Ranger2D erillisinä kerroksina mutta **samassa GPU-pipelinessa**:

```
World pass:  Sprite2D · Mesh2D · tilemap   (RGS1 → RenderItem → batched quads)
UI pass:     EVG panelit · EVG-teksti · HUD-spritet  (RGU1 → EVG)
```

- EVG on jo *software*-rasteroija (`EVGRasterRenderer.getRawBuffer():buffer`). Suunniteltu
  `EVGGLRenderer` (`RENDERING_EVG.md` §6) **jakaa saman GL-kontekstin ja saman glyph/sprite-atlaksen**
  Ranger2D:n batcherin kanssa.
- **Hybridi ensin:** rasteroi staattinen/kompleksi vektori-UI kerran tekstuuriksi (CPU-EVG),
  kompositoi GPU:lla halvalla joka frame; animoi maailma GPU:lla (`RENDERING_EVG.md` §6).
- Vektorimuodot voidaan myöhemmin (1) rasteroida tekstuuriin, (2) tessellöidä meshiksi tai
  (3) piirtää omalla shader-passilla (SDF).

---

## 11. Vaiheistus (de-riskattu: pikselit ruudulle ennen ABI:a)

Alkuperäinen hahmotelma aloitti ObjectID/resource-id:istä. Kääntö: **de-riskaa GPU-ydin ensin
olemassa olevaa host-polkua vasten (ei WASM:ia)**, koska se on ainoa aidosti epävarma osa.

| # | Vaihe | Sisältö | Validointi |
|---|-------|---------|-----------|
| **R1** | Kamera + batched quad | Ortho-Camera2D + Transform2D→4×4; yleistä `gfx_gpu_sprites`-jono batchatuksi (partikkelipolun malli); shaderiin kamera×world | Autopeli/Invaders näkyvät, 1 draw call / atlas |
| **R2** | Atlas + material-sort | texture-atlas-packer; sortKey (layer/material/texture); blend-ryhmät | Invaders ≥60 FPS batchattuna |
| **R3** | Scene graph | Container2D, konkatenoidut world-transformit, alpha-kertautus, cull | Nested transform -testi |
| **R4** | RenderItem + Mesh2D | yleistä RenderItem; oma geometria/UV/shaderit | Custom mesh -demo |
| **R5** | Resurssi-id:t (u64) | host-rekisteri (Texture/Atlas/Geometry/Material); keskitetyt magic-vakiot | — |
| **R6** | RGS1 retained scene-doc | ABI (§9) + host-lukija; guest kirjoittaa scenen | Rust/AS-guest piirtää spritejä RGS1:llä |
| **R7** | Fysiikkasidonta | `RigidBodyLink` (Cannon + host-2D); pose-writeback Transform2D:hen; onContact | Pinball/autopeli id-sidonnalla |
| **R8** | EVGGLRenderer + web WebGL | jaettu GL-konteksti; `es6` WebGL-backend; render textures / filters | UI+world samassa pipelinessä, web-parity |

R1–R4 tuottavat käyttökelpoisen 2D-enginen ilman WASM:ia. R5–R8 lisäävät ABI:n, fysiikan ja
webin. Myöhempi 3D (Transform3D, PerspectiveCamera, Mesh3D, valot) rakentuu R1–R6:n päälle
muuttamatta niitä.

**Ensimmäinen PR (R1):** ortho-Camera2D + Transform2D→4×4 + batchattu `gfx_gpu_sprites`
(instance-buffer, per-sprite M + uv-rect + tint), validoituna olemassa olevaa autopeliä vasten.
Ei uutta ABI:a, ei uutta id-järjestelmää — pelkkä GPU-ydin.

---

## 11c. Toteutuksen tila (heinäkuu 2026)

Ensimmäinen kohennuskierros tehty ja **käännösverifioitu**. GPU:n *runtime*-ajo vaatii
GLES-kelpoisen targetin (Pi / CI) — macOS = desktop-GL, GLES2 ei linkity, joten pikselitason
ajoa ei voi tehdä dev-koneella.

| Vaihe | Muutos | Tila | Verifiointi |
|-------|--------|------|-------------|
| **R0** | [`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr) `verifyMagic()`: 826425682 → 827803474 (RGW1, kanoninen `wasm/wasm_game_abi.h`) | ✅ | Ranger→es6 kääntyy; korjattu vakio generoidussa JS:ssä, vanha poissa. Turvallinen: `linearMode` tulee ensisijaisesti `abi.base != 0`:sta |
| **R1a** | [`gfx_sdl.rgr`](./gfx_sdl.rgr): batchattu sprite-polku (`rgfx_gpu_sprites_draw_queue_batched`) — coalesce peräkkäiset saman tekstuurin spritet, N draw call → ~1 per sheet. Vanha per-sprite säilyy env-fallbackina | ✅ | Ranger→cpp kääntyy; irrallinen `g++ -fsyntax-only -Wall -Wextra` puhdas; **koko generoitu `pong_sdl.cpp` kääntyy .o:ksi macOS+SDL2:lla** (baseline kaatui vain linkkiin GLES-symboleihin) |

**R1a-suunnittelutarkkuus:** batchattu polku on **pikseli-identtinen** per-sprite-polun kanssa
(sama nurkka-/UV-matematiikka, piirtojärjestys säilytetty — run flushataan vain tekstuurin
vaihtuessa, joten alpha-blend ei muutu). Oletuksena päällä; `RANGER_GFX_SPRITE_BATCH=0` palauttaa
vanhan polun ilman uudelleenkäännöstä (bisect-turva).

**Pi/CI runtime-verifiointi (seuraava vaihe, ei tehtävissä dev-koneella):**

```bash
# Pi tai GLES-kelpoinen kone:
npm run engine:game-sdl:smoke:invaders     # sheet/GPU-polku, 300 framea headless
npm run engine:game-sdl:run:physics_sandbox # visuaalinen: batchatut sheet-spritet
# vertaa: RANGER_GFX_SPRITE_BATCH=0 samat komennot (fallback) → identtinen kuva, enemmän draw calleja
```

**Seuraavaksi (avoinna):** R1b (ortho-Camera2D + Transform2D→4×4 vertex-shaderin uniformina) — vie
kameran/transformin GPU:lle ja on 3D-kelpoisen ytimen perusta. Erillinen inkrementti.

---

## 11b. Regressioriski ja mitigointi (tarkistettu ennen toteutusta)

**Lähtökohta (käyttäjän linjaus):** nykyisiä pelejä on vähän (~10 demoa) ja ne voi kirjoittaa
uudelleen. Siksi **peli-API:n taaksepäin-yhteensopivuus ei ole sitova** — mutta jaettu infra,
jolla on *omat testinsä* ja *muita kuluttajia kuin pelit*, on säilytettävä. Tarkistus koodia
vasten muutti riskikuvan olennaisesti kolmella havainnolla:

- **GPU-sprite-overlay on opt-in ja oletuksena OFF.** `gpuSheetOverlay = false` oletus, ja
  [`game_runtime.rgr:225`](./scripting/game_runtime.rgr) asettaa sen eksplisiittisesti falseksi.
  Kaikki pelit renderöivät **software-SoftCanvas-polulla**; `gfx_present` lataa koko framen yhtenä
  tekstuurina. → **R1:n batchaus koskee vain opt-in-overlayta, ei oletuspolkua.**
- **Base-present ja sprite-overlay ovat erilliset operaattorit.** `gfx_present` (full-frame) vs
  `gfx_gpu_sprites_*` (overlay) [`gfx_sdl.rgr`](./gfx_sdl.rgr). R1 koskee vain jälkimmäistä →
  base-present + partikkelit + split-screen eivät liiku, jos niiden koodia ei kosketa.
- **GPU-operaattorit ovat cpp-only, es6 = `"undefined"`-no-op.** Muut targetit (LLVM 22 KB
  -terminaali) eivät käytä GPU:ta. → uudet operaattorit **additiivisesti** cpp + es6-no-op
  -templateilla; ei koskaan poistaa/nimetä uudelleen olemassa olevia (pelit + testit sitovat niihin).

### Regressiovektorit ja mitigointi

| # | Vektori | Miksi vaarallinen | Mitigointi |
|---|---------|-------------------|-----------|
| A | **Software golden-frame -testit** ([`game-engine-render.test.ts`](../../tests/game-engine-render.test.ts)) | Väittävät tarkat pikselit; Transform2D/double-koordinaatit tai pyöristysmuutos oletuspolussa rikkoo ne | **Jäädytä software-polku R1–R4:ssä** (SoftCanvas + `drawEntity`-matematiikka byte-identtisenä). Ranger2D GPU-polku on additiivinen/opt-in. Software→Transform2D vasta myöhemmin, tietoisesti + golden-uudelleenbaseline |
| B | **Jaettu GLES2-present** (`gfx_sdl.rgr`) | Shader/VBO/GL-tila jaettu base+partikkeli+sprite+split kesken; regressio rikkoo **kaikkien** natiivipelien presentin | (1) sprite-batch opt-in-flagin takana (oletus off); (2) tee batchattu polku **uutena operaattorina/ohjelmana** (`gfx_gpu_sprites2_*`), älä mutatoi vanhaa → vanha jää fallbackiksi kunnes uusi todistettu; (3) aja SDL headless smoke (`engine:game-sdl:smoke:*`) per muutos |
| C | **Monikäännöstargetit** | Uusi `gl_*`/matriisi-operaattori ilman templatea targetille jota build käyttää → käännösvirhe siinä targetissa | Additiiviset operaattorit, es6-no-op kuten nyt; älä poista/nimeä olemassa olevia; LLVM-terminaali ei käytä GPU:ta → koskematon. Aja käännös per target |
| D | **WASM-silta (RGS1, R6)** | RGU1/RGW1-lukijoiden tai jaettujen magic/version-vakioiden koskeminen rikkoo autopelin (RGW1) + HUD:n (RGU1) | RGS1 on **uusi lohko + uudet exportit** (`rg_scene_ptr/size/revision`) + uusi magic → puhtaasti additiivinen. **Korjaa magic-vakiobugi ja keskitä vakiot ENSIN, erikseen** (ks. [`wasm_abi_io.rgr`](./scripting/wasm_abi_io.rgr) verifyMagic vertaa vanhentuneeseen "RAB1"-vakioon). RGS1-layout **yhdestä jaetusta lähteestä / koodigeneraattorilla** (RGU1 on nyt käsin 3× kopiona → drift-riski) |
| E | **EVG-ydin (EVGGLRenderer, R8)** | EVG:n **suurin kuluttaja on pdf_writer-työkalut** (`evg_png/pdf/html/component`) + evg-testit, ei pelimoottori. `EVGRasterRenderer`-signatuurien muutos rikkoo PDF/PNG/HTML-putken | Lisää `EVGRenderer` **uutena interfacena** jonka `EVGRasterRenderer` toteuttaa **muuttamatta** julkisia metodeja (`RENDERING_EVG.md` §6: "keep the scene API identical"). EVGGLRenderer on uusi sisar. Aja evg-työkaluketju + evg-testit |
| F | **Fysiikkasidonta (R7)** | Pelit käyttävät string-id-parallel-array-sidontaa; id-skeeman (string→u64) tai writebackin muutos rikkoo pinball/autopeli/sandbox + [`physics-cannon.test.ts`](../../tests/physics-cannon.test.ts). **Cannon-portilla on omat testinsä** (`cannon_*_test.rgr`) — ei saa regressoida | `RigidBodyLink` **additiivisena** joka kääri olemassa olevan writebackin; älä poista parallel-array-polkua ennen kuin uusi todistettu. Pidä string-id-join toimivana (avoin päätös #1). **Cannon-portti itsessään koskematon** — vain peli-kerroksen sidonta muuttuu |
| G | **Determinismi / float-vuoto** | Transform2D on double; jos float vuotaa pelilogiikkaan, cross-target-determinismi (golden Mac↔Pi, ES6 vs natiivi -hash) rikkoutuu | `RENDERING_EVG.md` §7 -sääntö: render-float on presentaatiota, ei koskaan syötä logiikkaan. Logiikka int/fixed. **Fixed-point RGS1-langalla** (avoin päätös #2) säilyttää determinismin |

### Suositeltu strategia (käyttäjän "pelit voi kirjoittaa uudelleen" -linjauksen mukaan)

Koska pelit ovat harvoja ja uudelleenkirjoitettavia, **rakenna Ranger2D puhtaana additiivisena
polkuna vanhan moottorin rinnalle**, migratoi ~10 demoa sen päälle, ja **poista vanha
sprite-polku vasta kun parity on todistettu** — mieluummin kuin mutatoi jaettua
software/GPU-polkua paikallaan (mikä riskeeraa golden-frame- + työkalu- + Cannon-portti-regressiot).
Tämä on sekä puhtain että linjauksesi mukainen.

**Järjestyskorjaus vaiheistukseen (§11):**

- **R0 (uusi, ensin):** korjaa RGW1 magic-vakiobugi + keskitä ABI-magic/version-vakiot yhteen
  lähteeseen. Pieni, erillinen, poistaa RGS1:n pohjalta epäjohdonmukaisuuden. (Flagattu jo
  erillisenä tehtävänä.)
- **R1–R4:** software-polku **jäädytetty**; Ranger2D GPU-polku additiivinen (uudet operaattorit,
  opt-in-flag). Golden-frame- ja SDL-smoke-testit pysyvät vihreinä koko ajan.
- **Migraatio-checkpoint** ennen vanhan polun poistoa: kaikki ~10 demoa Ranger2D:llä + kaikki
  nykyiset testit vihreinä (game-engine-render, game-runner, physics-cannon, evg, wasm-demot).

### Nykyinen testipinta (regressioverkko)

| Testi | Suojaa |
|-------|--------|
| [`game-engine-render.test.ts`](../../tests/game-engine-render.test.ts) | SoftCanvas-pikselit, SDL headless (vektori A) |
| [`game-runner.test.ts`](../../tests/game-runner.test.ts) | Pong/Invaders/Breakout/Pacman/ääni/fysiikka/Ylos |
| [`physics-cannon.test.ts`](../../tests/physics-cannon.test.ts) | Cannon-portti (vektori F) |
| `cannon_*_test.rgr` ([`physics/src/`](./physics/src/)) | Cannon-portin oma yksikkötestisarja (vektori F) |
| [`tsx-engine.test.ts`](../../tests/tsx-engine.test.ts), [`game-scripting.test.ts`](../../tests/game-scripting.test.ts) | ComponentEngine, reducer |
| [`ts-to-ranger-native.test.ts`](../../tests/ts-to-ranger-native.test.ts), [`ts-to-ranger-host.test.ts`](../../tests/ts-to-ranger-host.test.ts) | Staattinen käännös + resource/event-silta |
| `engine:wasm:demo:*`, `engine:game-sdl:smoke:*` | WASM Pong/Autopeli + SDL dummy-driver (vektorit B, D) |
| evg-työkaluketju + evg-testit | EVG-ydin + PDF/PNG/HTML (vektori E) |

**Sääntö toteutukseen:** aja relevantti testijoukko per muutos; älä poista mitään jaettua ennen
kuin korvaava polku on vihreä koko verkolla.

---

## 12. Avoimet päätökset

1. **Scene-entiteetin id: u64 vai vakaa string?** Suositus u64 sisäisenä + string debug-nimenä.
   Fysiikkasidonta käyttää nyt stringiä — migraatio vaatii linjauksen.
2. **Transform2D-numeriikka:** fixed-point (deterministinen, int-yhteensopiva) vai f32 (GPU-natiivi)
   RGS1-langalla? Pelilogiikka pysyy int; kysymys koskee vain render-lankaa.
3. **Instancing vs. dynaaminen vertex-buffer** GLES2:ssa (Pi VideoCore) — instancing vaatii
   laajennoksen; dynaaminen VBO toimii kaikkialla. Aloita dynaamisella VBO:lla.
4. **RGS1 max-node-count / lohkon koko** (RGU1 = 64 nodea / 8 KB). Maailma voi tarvita tuhansia →
   suurempi lohko tai sivutus.
5. **EVG GPU: SDF vai rasteroi-tekstuuriin** vektorimuodoille — hybridi ensin (§10).

---

## 13. Ei-tavoitteet (V1)

- Täysi 3D-scene (Transform3D/PerspectiveCamera/Mesh3D/valot) — rakennetaan R1–R6:n päälle myöhemmin.
- Yksi universaali fysiikkamoottori — Cannon + host-2D pysyvät erillisinä (§8).
- Three.js-tyylinen julkinen API 2D-käyttäjälle — sprite tarvitsee vain
  `x,y,rotation,scaleX,scaleY,anchor,alpha,layer`, ei `Quaternion/Vector3/Matrix4`.
- Pixin `PerspectiveMesh` -tyyppinen "perspektiivikorjattu 2D-taso" erillistapauksena — Rangerissa
  perspektiivi tulee oikeasta 3D-kamerasta myöhemmin.

---

## 14. Yhteenveto

Rakennetaan **yksi `Ranger Render Core`** (GPU-geometriat, materiaalit, shader-pipeline, 4×4,
Z-syvyys, ortho-kamera), jonka päälle **yksinkertainen 2D-API** ja rinnalle EVG-UI — sama pino
palvelee myöhempää Ranger3D:tä. WASM-scene-ABI (RGS1) noudattaa RGU1:n retained-doc-muotoa, ja
fysiikka sidotaan visuaaleihin **identiteetillä** (EntityId = Cannon-body id), formalisoiden sen
minkä pelit jo tekevät string-id:llä. Ensimmäiset vaiheet (R1–R4) tuottavat näkyvän 2D-enginen ja
rakentavat kaiken vaikean GPU-infran, jota 3D joka tapauksessa tarvitsee — Three.js-porttia parempi
seuraava askel.
