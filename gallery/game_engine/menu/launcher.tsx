/// <reference path="../scripting/game.d.ts" />
/// <reference path="./menu.d.ts" />
//
// Ranger Launcher — rich EVG front page authored in TypeScript/TSX.
// ============================================================================
// Same two-screen launcher as menu/game.as (categories -> that category's
// games), but authored with real JS: gameCatalog is filtered/mapped with array
// methods, state is a plain object, and the layout is JSX. The host renders the
// EVGElement tree this returns with the SAME WasmUiRenderer the .as menu uses,
// so borders / rounded corners / TTF text / background art / the glow halo all
// come out identical — the renderer is the shared core, only the front-end
// language changed.
//
// The activation glow is a real closure callback: pressing A on a category
// starts a glow flash and stashes an `onDone` FUNCTION in state; when the flash
// finishes a frame later, update() calls it to perform the deferred screen
// switch. That capture-a-callback pattern was fragile in the .as bridge (method
// binding through asc); here it is just how JS works.
//
// NOTE: JSX attribute names are camelCase (flexDirection, backgroundColor,
// borderRadius, backgroundImage, glow, ...). The TSX parser tokenises `-`, so
// kebab-case names are NOT valid here.
//
//   up/down/left/right   move selection (left/right never exit the list)
//   enter / A            open a category, launch a game, or use the Back tile
//   back                 games screen -> categories (the "‹ Takaisin" tile at
//                        index 0, or the hardware Back/Quit button Q/Esc/Select)
//
// Game tiles show the game's own screenshot (catalog `icon`, by convention
// games/<id>/assets/image.png — see scripting/game_icon_shots_demo.rgr) as the
// tile image, so a kid can pick a game by picture instead of reading. The grid
// is PAGED: at most GAMES_PER_PAGE games render at once and the visible page is
// derived from the selection, so simply holding right walks through every page
// with no extra buttons. The Back tile is pinned to slot 0 of every page.
// ============================================================================

const FLASH_MS = 420;
// 9 games + the pinned Back tile = 10 tiles, laid out 5 x 2 in the panel.
const GAMES_PER_PAGE = 9;
// ASCII arrows for labels, built OUTSIDE the JSX: a literal "<" inside JSX
// children reads as a tag opener to the TSX tokenizer, and typographic arrows
// ("‹") come out as mojibake on the Latin-1 TTF text path.
const BACK_ARROW = "<";
const NEXT_ARROW = ">";

// Distinct categories in catalog order, "Games" forced first. Pure JS.
function categories() {
  const seen = {};
  const order = [];
  for (const e of gameCatalog) {
    const c = e.category || "Games";
    if (!seen[c]) {
      seen[c] = 1;
      order.push(c);
    }
  }
  order.sort((a, b) => (a === "Games" ? -1 : b === "Games" ? 1 : 0));
  return order;
}

function gamesIn(cat) {
  return gameCatalog.filter((e) => (e.category || "Games") === cat);
}

// Background art for a category tile (host loads the pixels; missing = none).
function artFor(cat) {
  if (cat === "Games") return "gallery/game_engine/menu/assets/games.png";
  if (cat === "Tests") return "gallery/game_engine/menu/assets/tools.png";
  return "";
}

// A 0 -> 1 -> 0 flash sampled from the host clock; 0 when no flash is running.
function flashLevel(anim, now) {
  if (!anim) return 0;
  const t = now - anim.start;
  if (t < 0 || t >= anim.dur) return 0;
  const p = t / anim.dur;
  return p < 0.5 ? p * 2 : (1 - p) * 2;
}

function initState() {
  return { screen: "cats", sel: 0, cat: 0, launchPath: "", quitApp: 0, now: 0, anim: null, onDone: null };
}

function update(props) {
  const s = props.state;
  const now = props.time;
  const cats = categories();
  let screen = s.screen;
  let sel = s.sel;
  let cat = s.cat;

  // Back/quit is context-sensitive: from a category's game list it goes back up
  // to the categories screen. The top categories screen is the app root — back
  // there is a no-op so the launcher never exits itself (you'd otherwise drop to
  // the Linux desktop with no easy way back). It stays put until the host is
  // killed externally.
  if (props.quit) {
    if (screen === "games") {
      return { screen: "cats", sel: cat, cat, launchPath: "", quitApp: 0, now, anim: null, onDone: null };
    }
    return { screen, sel, cat, launchPath: "", quitApp: 0, now, anim: null, onDone: null };
  }

  // A glow flash is running: when it finishes, call the stashed callback to
  // apply the deferred transition it captured, then clear the animation.
  if (s.anim) {
    if (now - s.anim.start >= s.anim.dur) {
      // Bind the callback to a local before calling it: the interpreter invokes
      // a closure through a plain identifier, not through a member-access call
      // (s.onDone() returns undefined; cb() runs it).
      const cb = s.onDone;
      const next = cb ? cb() : {};
      return {
        screen: next.screen ? next.screen : screen,
        sel: next.sel === undefined ? sel : next.sel,
        cat: next.cat === undefined ? cat : next.cat,
        launchPath: "",
        quitApp: 0,
        now,
        anim: null,
        onDone: null
      };
    }
    // hold state while the flash plays out
    return { screen, sel, cat, launchPath: "", quitApp: 0, now, anim: s.anim, onDone: s.onDone };
  }

  let launchPath = "";
  if (screen === "cats") {
    const n = cats.length;
    if (props.up || props.left) sel = (sel + n - 1) % n;
    if (props.down || props.right) sel = (sel + 1) % n;
    if (props.action) {
      // start a flash on the selected tile; the callback opens that category
      const targetCat = sel;
      return {
        screen, sel, cat, launchPath: "", quitApp: 0, now,
        anim: { start: now, dur: FLASH_MS },
        onDone: () => {
          // land on the first game (index 1), not the Back tile at index 0 —
          // unless the category is empty, where only the Back tile exists.
          const gl = gamesIn(categories()[targetCat]).length;
          return { screen: "games", cat: targetCat, sel: gl > 0 ? 1 : 0 };
        }
      };
    }
  } else {
    const list = gamesIn(cats[cat]);
    // index 0 is the "Back" tile; games occupy 1..list.length. left/up = previous,
    // right/down = next — the SAME mapping as the categories screen, so left never
    // surprises the player by dropping out of the list. Returning to the categories
    // is either the Back tile (sel 0 + A) or the Back/Quit button (props.quit).
    const n = list.length + 1;
    if (props.up || props.left) sel = (sel + n - 1) % n;
    if (props.down || props.right) sel = (sel + 1) % n;
    if (props.action) {
      if (sel === 0) {
        screen = "cats";
        sel = cat;
      } else if (list.length > 0) {
        launchPath = list[sel - 1].path;
      }
    }
  }

  return { screen, sel, cat, launchPath, quitApp: 0, now, anim: null, onDone: null };
}

// ---------------------------------------------------------------------------
// Palette + tile styling. The EVG renderer (WasmUiRenderer) paints, per box, a
// 2-stop linear gradient (gradientFrom/gradientTo/gradientDir: 0 = top->bottom),
// a glow halo, a rounded border and clipped background art. We lean on the
// vertical gradient for a soft "lit from above" depth, and reserve a warm gold
// fill for the selected tile so the cursor reads instantly — even on a static
// screenshot, before the animated glow lands.
// ---------------------------------------------------------------------------
const INK = "#e9edfb";      // primary label text on dark/blue tiles
const INK_DIM = "#93a0cc";  // secondary hint text
const GOLD = "#ffe27a";     // accent (selected)
const NAVY_TXT = "#1b2140"; // dark text that reads on the gold selected tile

// A selected tile flips to a warm gold gradient; otherwise a cool blue-slate.
function tileFrom(on) { return on ? "#ffe58a" : "#46579c"; }
function tileTo(on) { return on ? "#eca93a" : "#293357"; }
function tileBorder(on) { return on ? "#fff2b8" : "#5b6ea8"; }
function tileText(on) { return on ? NAVY_TXT : INK; }

// Category art tiles keep their background image; the gradient is only a
// fallback (missing art) so we tint it toward the selection state too.
function artFrom(on) { return on ? "#3c4a86" : "#2b3457"; }
function artTo(on) { return on ? "#242c4c" : "#1c2440"; }

// Glow for a tile: the bright animated flash while it plays, otherwise a steady
// soft halo on the current selection.
function glowFor(s, on) {
  if (on && s.anim) return flashLevel(s.anim, s.now);
  if (on) return 0.5;
  return 0;
}

function categoryScreen(s) {
  const cats = categories();
  return (
    <View flexDirection="column" alignItems="center" padding="28px" width="100%">
      <Label color={INK} fontSize="34px">Ranger</Label>
      <Label color={INK_DIM} fontSize="15px" margin="4px">valitse kategoria</Label>
      {/* explicit width so the row shrink-wraps its tiles and the column can
          centre it — an auto-width flex child stretches full-width in EVGLayout,
          which would push the tiles to the left and defeat the fit-to-window
          scale. Each tile is 200px wide + 12px margin each side = 224px. */}
      <View flexDirection="row" alignItems="center" margin="18px"
            width={(cats.length * 224) + "px"}>
        {cats.map((c, i) => {
          const on = i === s.sel;
          return (
            <View flexDirection="column" alignItems="center" width="200px" margin="12px">
              <View width="176px" height="176px" borderRadius="20px"
                    borderWidth="3px" borderColor={tileBorder(on)}
                    gradientFrom={artFrom(on)} gradientTo={artTo(on)} gradientDir="0"
                    backgroundImage={artFor(c)}
                    glow={glowFor(s, on)} />
              <Label color={on ? GOLD : INK} fontSize="20px" margin="10px">{c}</Label>
            </View>
          );
        })}
      </View>
      <Label color={INK_DIM} fontSize="14px" margin="6px">A avaa, nuolet liikkuvat</Label>
    </View>
  );
}

// The page a selection index belongs to: sel 0 is the pinned Back tile (shown
// on every page, so it borrows page 0); games 1..N map 9-per-page.
function pageOf(sel) {
  if (sel <= 0) return 0;
  return Math.floor((sel - 1) / GAMES_PER_PAGE);
}

// One grid tile: the game's screenshot fills the whole box (the image IS the
// tile); the title sits underneath like on the categories screen. Games with
// no screenshot yet get the gradient box with a big initial letter, so every
// tile stays picture-first for a kid who can't read the label.
function gameTile(s, e, on) {
  const icon = e.icon ? e.icon : "";
  return (
    <View flexDirection="column" alignItems="center" width="220px" margin="8px">
      <View width="204px" height="150px" borderRadius="16px"
            borderWidth="3px" borderColor={tileBorder(on)}
            gradientFrom={tileFrom(on)} gradientTo={tileTo(on)} gradientDir="0"
            backgroundImage={icon} alignItems="center"
            glow={glowFor(s, on)}>
        {icon === "" ? (
          <Label color={tileText(on)} fontSize="64px" margin="30px">{e.title.substring(0, 1)}</Label>
        ) : null}
      </View>
      <View flexDirection="row" alignItems="center" width="216px" margin="4px">
        {
          e.title.split(" ").map((word, index) => (
            <Label inline color={on ? GOLD : INK} fontSize="18px" margin="2px" textAlign="center">{word}</Label>
          ))
        }
      </View>
    </View>
  );
}

// The pinned Back tile mirrors the game-tile geometry so the grid stays even.
function backTile(s, on) {
  return (
    <View flexDirection="column" alignItems="center" width="220px" margin="8px">
      <View width="204px" height="150px" borderRadius="16px"
            borderWidth="3px" borderColor={tileBorder(on)}
            gradientFrom={artFrom(on)} gradientTo={artTo(on)} gradientDir="0"
            alignItems="center" glow={glowFor(s, on)}>
        <Label color={on ? GOLD : INK} fontSize="56px" margin="32px">{BACK_ARROW}</Label>
      </View>
      <Label color={on ? GOLD : INK} fontSize="18px" margin="4px">Takaisin</Label>
    </View>
  );
}

function gamesScreen(s) {
  const cats = categories();
  const list = gamesIn(cats[s.cat]);
  // A "Back" tile leads the grid (index 0) so returning to the categories is
  // reachable with the stick alone — no dependency on a separate hardware Back
  // button, which a bare joystick console may not have. The games follow it,
  // but only the current page's slice renders (selection index stays GLOBAL:
  // update() wraps over the full list and the page follows the cursor).
  const page = pageOf(s.sel);
  const pages = Math.max(1, Math.ceil(list.length / GAMES_PER_PAGE));
  const first = page * GAMES_PER_PAGE;
  const visible = list.slice(first, first + GAMES_PER_PAGE);
  return (
    <View flexDirection="column" alignItems="center" padding="22px" width="100%">
      <Label color={INK} fontSize="26px" margin="6px">{cats[s.cat]}</Label>
      {/* panel behind the wrapping tile grid: a subtle vertical gradient + a
          hairline border reads as a framed shelf rather than a flat block.
          5 tiles x (220px + 2*8px margin) + 2*22px padding = 1224px, plus a
          little slack so the border never squeezes the 5th column onto the
          next row. */}
      <View flexDirection="row" alignItems="center" padding="22px" margin="8px"
            width="1240px" borderRadius="24px"
            borderWidth="1px" borderColor="#2c3352"
            gradientFrom="#242b48" gradientTo="#151829" gradientDir="0">
        {backTile(s, s.sel === 0)}
        {visible.map((e, i) => gameTile(s, e, s.sel === (first + i + 1)))}
      </View>
      {pages > 1 ? (
        <Label color={GOLD} fontSize="16px" margin="4px">{BACK_ARROW + " sivu " + (page + 1) + " / " + pages + " " + NEXT_ARROW}</Label>
      ) : null}
      <Label color={INK_DIM} fontSize="14px" margin="6px">{"A pelaa - " + BACK_ARROW + " Takaisin tai Q"}</Label>
    </View>
  );
}

function hud(props) {
  const s = props.state;
  if (s.screen === "cats") {
    return categoryScreen(s);
  }
  return gamesScreen(s);
}
