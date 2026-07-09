/// <reference path="../scripting/game.d.ts" />
/// <reference path="./menu.d.ts" />
//
// Launcher menu game — first game loaded by game_sdl; returned to after each sub-game.
// Host injects `gameCatalog` (scanned from --games-dir). EVG hud() draws the list.
//
// Controls: Up/Down = scroll, Space/Enter = play, Q/Esc = quit app.

const VISIBLE_ROWS = 8;

function initState() {
  return {
    selected: 0,
    scroll: 0,
    launchPath: "",
    quitApp: 0,
    menuText: "",
    hintText: "Up/Down select   Space play   Q quit"
  };
}

function buildMenuText(selected: number, scroll: number) {
  const list = gameCatalog;
  const count = list.length;
  if (count === 0) {
    return "No games found.\nAdd subfolders with index.tsx\nto the games directory.";
  }
  let text = "";
  let i = scroll;
  const end = scroll + VISIBLE_ROWS;
  if (end > count) {
    i = scroll;
  }
  while (i < count && i < scroll + VISIBLE_ROWS) {
    const entry = list[i];
    let prefix = "  ";
    if (i === selected) {
      prefix = "> ";
    }
    text = text + prefix + entry.title + "\n";
    i = i + 1;
  }
  if (scroll > 0) {
    text = "^ more above ^\n" + text;
  }
  if (scroll + VISIBLE_ROWS < count) {
    text = text + "v more below v\n";
  }
  return text;
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
      menuText: state.menuText,
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

  const menuText = buildMenuText(selected, scroll);

  return {
    selected: selected,
    scroll: scroll,
    launchPath: launchPath,
    quitApp: 0,
    menuText: menuText,
    hintText: state.hintText
  };
}

function hud(props) {
  const s = props.state;
  return (
    <View
      flexDirection="column"
      padding="14px"
      width="100%"
      height="100%"
      backgroundColor="#0c1020"
    >
      <Label color="#8cd3ff" padding="2px">
        Ranger Game Engine
      </Label>
      <Label color="#6a8aaa" padding="2px">
        {s.hintText}
      </Label>
      <View flexDirection="column" padding="8px" width="100%" flex="1">
        <Label color="#dce8ff" padding="2px">
          {s.menuText}
        </Label>
      </View>
      <Label color="#5a6a8a" padding="2px">
        {gameCatalog.length} games
      </Label>
    </View>
  );
}
