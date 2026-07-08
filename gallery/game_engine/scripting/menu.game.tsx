/// <reference path="./game.d.ts" />
//
// Example game-screen script for the Ranger engine.
//
// It is authored in TSX and evaluated at runtime by the ComponentEngine. The
// host injects the `game` and `Buttons` globals and drives the script by
// calling the functions below (see GAME_SCRIPTING.md). State transitions are
// pure reducers: each handler returns the NEXT state.
//
// Note the apostrophe in "Let's play" below — that used to break the TSX parser
// (ISSUES.md #1) and now works.

function initState() {
  return { screen: "menu", score: 0, title: game.title };
}

// Menu screen: ACTION starts the game, QUIT leaves.
function onButton(props) {
  if (props.button == "action") {
    return { screen: "play", score: 0, title: props.state.title };
  }
  if (props.button == "quit") {
    return { screen: "quit", score: props.state.score, title: props.state.title };
  }
  return props.state;
}

// Render the current screen as a UI tree (JSX -> EVG).
function render(props) {
  return (
    <View flexDirection="column" padding="16px">
      <Label color="#ffffff">{props.state.title}</Label>
      <Label color="#8fd3ff">Let's play! Press ACTION to start.</Label>
      <Label color="#8fd3ff">Score: {props.state.score}</Label>
    </View>
  );
}
