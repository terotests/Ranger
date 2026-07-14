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
//   up/down/left/right   move selection
//   enter / A            open a category (after a glow flash), or launch a game
//   left / back          games screen -> categories
// ============================================================================

const FLASH_MS = 420;

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
          return { screen: "games", cat: targetCat, sel: 0 };
        }
      };
    }
  } else {
    const list = gamesIn(cats[cat]);
    const n = Math.max(1, list.length);
    if (props.up) sel = (sel + n - 1) % n;
    if (props.down) sel = (sel + 1) % n;
    if (props.left) {
      screen = "cats";
      sel = cat;
    }
    if (props.action && list.length > 0) {
      launchPath = list[sel].path;
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
      <Label color={INK_DIM} fontSize="14px" margin="6px">A avaa   ·   nuolet liikkuvat</Label>
    </View>
  );
}

function gamesScreen(s) {
  const cats = categories();
  const list = gamesIn(cats[s.cat]);
  return (
    <View flexDirection="column" alignItems="center" padding="22px" width="100%">
      <Label color={INK} fontSize="26px" margin="6px">{cats[s.cat]}</Label>
      {/* panel behind the wrapping tile grid: a subtle vertical gradient + a
          hairline border reads as a framed shelf rather than a flat block. */}
      <View flexDirection="row" alignItems="center" padding="22px" margin="8px"
            width="1216px" borderRadius="24px"
            borderWidth="1px" borderColor="#2c3352"
            gradientFrom="#242b48" gradientTo="#151829" gradientDir="0">
        {list.map((e, i) => {
          const on = i === s.sel;
          return (
            <View width="204px" height="150px" padding="12px" margin="8px"
                  borderRadius="16px" alignItems="center"
                  borderWidth="2px" borderColor={tileBorder(on)}
                  gradientFrom={tileFrom(on)} gradientTo={tileTo(on)} gradientDir="0"
                  glow={glowFor(s, on)}>
              {
                e.title.split(" ").map((word, index) => (
                  <Label inline color={tileText(on)} fontSize="22px" textAlign="center">{word}</Label>
                ))
              }
            </View>
          );
        })}
      </View>
      <Label color={INK_DIM} fontSize="14px" margin="6px">A pelaa   ·   vasen takaisin</Label>
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
