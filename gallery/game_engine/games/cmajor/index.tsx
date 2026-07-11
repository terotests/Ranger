/// <reference path="../../scripting/game.d.ts" />
//
// Music test — swap MELODY_INSTRUMENT and Space to replay.
//
// Run:
//   npm run engine:game-sdl:run:cmajor

import { musicScoreEvent, stopMusicEvent } from "../../scripting/game_helpers";

const SCORE_ID = "summit-music";

/** Change this: piano | violin | harp | flute | guitar | brass | organ | pad | bell | square | sine */
const MELODY_INSTRUMENT = "violin";

const SEMITONES = 0;

function summitMelody(instrument) {
  return (
    "tempo 108\n" +
    "beats 4/4\n" +
    "\n" +
    "@melody " + instrument + "\n" +
    "1:G4 1:B4 1:D5 2:G5 1:A4 1:C5 1:E5 2:A5\n"
  );
}

const ACTIVE_SCORE = summitMelody(MELODY_INSTRUMENT);

function sprites() {
  return [{ id: "dot", kind: "circle", rad: 6, r: 120, g: 220, b: 160 }];
}

function initState() {
  return {
    entities: { dot: { x: 240, y: 135 } },
    playCount: 0
  };
}

function wantsReplay(props) {
  if (props.action) {
    return true;
  }
  const input = props.input;
  if (input) {
    if (input.action) {
      return true;
    }
  }
  return false;
}

function update(props) {
  const s = props.state;
  const events = [];
  let playCount = s.playCount;
  if (playCount == null) {
    playCount = 0;
  }

  const scoreKey = SCORE_ID + ":" + MELODY_INSTRUMENT + ":" + SEMITONES;
  if (session.musicId != scoreKey) {
    events.push(stopMusicEvent());
    events.push(musicScoreEvent(ACTIVE_SCORE, false, SEMITONES));
    session.musicId = scoreKey;
    playCount = playCount + 1;
  } else {
    if (wantsReplay(props)) {
      events.push(stopMusicEvent());
      events.push(musicScoreEvent(ACTIVE_SCORE, false, SEMITONES));
      playCount = playCount + 1;
    }
  }

  return {
    entities: { dot: { x: 240, y: 135 } },
    playCount: playCount,
    events: events
  };
}

function hud(props) {
  const s = props.state;
  let count = s.playCount;
  if (count == null) {
    count = 0;
  }
  return (
    <View flexDirection="column" padding="8px" background="#0b1020cc">
      <Label text="Summit melody test" color="#f0f8ff" fontSize="14px" />
      <Label text={"Instrument: " + MELODY_INSTRUMENT} color="#b4c8dc" fontSize="11px" />
      <Label text="Try square vs pad vs violin" color="#8ca0b4" fontSize="11px" />
      <Label text="Space = replay" color="#8ca0b4" fontSize="11px" />
      <Label text={"Plays: " + count} color="#7088a0" fontSize="11px" />
    </View>
  );
}
