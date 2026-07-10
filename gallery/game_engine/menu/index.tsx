/// <reference path="../scripting/game.d.ts" />
/// <reference path="./menu.d.ts" />
//
// Launcher menu game — first game loaded by game_sdl; returned to after each sub-game.
// Host injects `gameCatalog` (scanned from --games-dir). EVG hud() draws one Label/row.
//
// Controls: Up/Down or D-pad = scroll, A/Space = play, Q/Esc = quit app.
// In games: Select/B = back to this menu.

const VISIBLE_ROWS = 8;

function initState() {
  return {
    selected: 0,
    scroll: 0,
    launchPath: "",
    quitApp: 0,
    visibleRows: [],
    hintText: "D-pad / Up-Down   A / Space play   Q quit"
  };
}

function buildVisibleRows(selected: number, scroll: number) {
  const list = gameCatalog;
  const count = list.length;
  const rows = [];
  if (count === 0) {
    rows.push("No games found.");
    rows.push("Add index.tsx under games/");
    return rows;
  }
  if (scroll > 0) {
    rows.push("^ more above ^");
  }
  let i = scroll;
  while (i < count && i < scroll + VISIBLE_ROWS) {
    const entry = list[i];
    let prefix = "  ";
    if (i === selected) {
      prefix = "> ";
    }
    rows.push(prefix + entry.title);
    i = i + 1;
  }
  if (scroll + VISIBLE_ROWS < count) {
    rows.push("v more below v");
  }
  return rows;
}

function update(props) {
  const state = props.state;
  const list = gameCatalog;
  const count = list.length;

  if (props.quit) {
    return {
      selected: state.selected,
      scroll: state.scroll,
      launchPath: "",
      quitApp: 1,
      visibleRows: state.visibleRows,
      hintText: state.hintText
    };
  }

  let selected = state.selected;
  let scroll = state.scroll;

  if (count > 0) {
    if (props.up) {
      selected = selected - 1;
      if (selected < 0) {
        selected = count - 1;
      }
    }
    if (props.down) {
      selected = selected + 1;
      if (selected >= count) {
        selected = 0;
      }
    }
    if (selected >= count) {
      selected = count - 1;
    }
    if (selected < scroll) {
      scroll = selected;
    }
    if (selected >= scroll + VISIBLE_ROWS) {
      scroll = selected - VISIBLE_ROWS + 1;
    }
  }

  let launchPath = "";
  if (props.action && count > 0) {
    launchPath = list[selected].path;
  }

  const visibleRows = buildVisibleRows(selected, scroll);

  return {
    selected: selected,
    scroll: scroll,
    launchPath: launchPath,
    quitApp: 0,
    visibleRows: visibleRows,
    hintText: state.hintText
  };
}

function hud(props) {
  const s = props.state;
  const list = gameCatalog;
  return (
    <View flexDirection="column" padding="10px" backgroundColor="#0c1020">
      <Label color="#8cd3ff" padding="2px">Ranger Game Engine</Label>
      <Label color="#6a8aaa" padding="2px">{s.hintText}</Label>
      <View flexDirection="column" padding="6px">
        {s.visibleRows.map((line) => (
          <Label color="#dce8ff" padding="2px">{line}</Label>
        ))}
      </View>
      <Label color="#5a6a8a" padding="2px">{list.length} games</Label>
    </View>
  );
}
