# `generated/`

`ui_ios.swift` lands here: the `gallery/ui` demo, the EVG controllers, the
stylesheet cascade, the layout engine, the display list, the Vela runtime that
draws the chart and the `UiIos` facade — about 46 000 lines of Swift, in one
file, compiled from Ranger.

It is **not checked in**. It is a compiler artefact of `../ranger/ui_ios.rgr`
and the `gallery/ui` + `gallery/evg` + `gallery/vela` trees behind it, and a
stale copy of it is the one way this port can silently drift from the demo
everything else in the repository runs.

```bash
bash gallery/ui/ios/scripts/build-ranger.sh   # just this file
npm run ui:ios                                # this file, then the app
```
