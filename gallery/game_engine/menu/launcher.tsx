/// <reference path="../scripting/game.d.ts" />
/// <reference path="./menu.d.ts" />
//
// Ranger Launcher — rich EVG front page authored in TypeScript/TSX.
// ============================================================================
// Same two-screen launcher as menu/game.as (categories -> that category's
// games), but authored with real JS: gameCatalog is filtered/mapped with array
// methods, state is a plain object, and the layout is JSX. The host renders the
// EVGElement tree this returns with the SAME WasmUiRenderer the .as menu uses,
// so borders / rounded corners / TTF text (and, once wired, glow + art) all come
// out identical — the renderer is the shared core, only the front-end language
// changed.
//
// NOTE: JSX attribute names are camelCase (flexDirection, backgroundColor,
// borderRadius, ...). The TSX parser tokenises `-`, so kebab-case attribute
// names (flex-direction) are NOT valid here; EVGElement.setAttribute accepts the
// camelCase spelling.
//
//   up/down/left/right   move selection
//   enter / A            open a category, or launch the selected game
//   left / back          games screen -> categories
// ============================================================================

// Distinct categories in catalog order, "Games" forced first (mirrors the .as
// launcher's game_catalog ordering). Pure JS - the kind of thing that was
// painful in the .as bridge.
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

function initState() {
  return { screen: "cats", sel: 0, cat: 0, launchPath: "", quitApp: 0 };
}

function update(props) {
  const s = props.state;
  const cats = categories();
  let screen = s.screen;
  let sel = s.sel;
  let cat = s.cat;
  let launchPath = "";

  if (props.quit) {
    return { screen, sel, cat, launchPath: "", quitApp: 1 };
  }

  if (screen === "cats") {
    const n = cats.length;
    if (props.up || props.left) sel = (sel + n - 1) % n;
    if (props.down || props.right) sel = (sel + 1) % n;
    if (props.action) {
      cat = sel;
      screen = "games";
      sel = 0;
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

  return { screen, sel, cat, launchPath, quitApp: 0 };
}

// gold when selected, muted blue otherwise (the .as menu does the same so a
// static screenshot reads the selection even before the animated glow lands).
function borderColor(on) {
  return on ? "#ffe878" : "#7896d2";
}

function categoryScreen(s) {
  const cats = categories();
  return (
    <View flexDirection="column" alignItems="center" padding="24px">
      <Label color="#ecf0fa" fontSize="34px">GAMES</Label>
      <View flexDirection="row" alignItems="center">
        {cats.map((c, i) => (
          <View flexDirection="column" alignItems="center" width="200px" margin="12px">
            <View width="176px" height="176px" borderRadius="16px"
                  borderWidth="3px" borderColor={borderColor(i === s.sel)}
                  backgroundColor="#242a40" />
            <Label color="#ecf0fa" fontSize="20px" margin="6px">{c}</Label>
          </View>
        ))}
      </View>
    </View>
  );
}

function gamesScreen(s) {
  const cats = categories();
  const list = gamesIn(cats[s.cat]);
  return (
    <View flexDirection="column" alignItems="center" padding="18px">
      <View flexDirection="column" alignItems="center" padding="16px" width="340px"
            borderRadius="16px" backgroundColor="#1e2234">
        <Label color="#ecf0fa" fontSize="24px">{cats[s.cat]}</Label>
        {list.map((e, i) => (
          <View width="280px" padding="12px" margin="6px" borderRadius="10px"
                borderWidth="2px" borderColor={borderColor(i === s.sel)}
                backgroundColor="#3c5aa0">
            <Label color="#ecf0fa" fontSize="18px" textAlign="center">{e.title}</Label>
          </View>
        ))}
      </View>
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
