# gallery/realtrainer/ios/generated

`rt_ios.swift` lands here and is **not** checked in.

It is a compiler artefact of `../ranger/rt_ios.rgr` and, through it, of
`gallery/realtrainer/src`, `gallery/ui` and `gallery/evg` — around 19 000 lines
of Swift holding the EVG controllers, the stylesheet cascade, the layout
engine, the display list and the RealTrainer demo itself. All of it is Ranger;
none of it is written twice for Apple.

A checked-in copy is the one way this port could silently drift from the demo
the browser, the headless check and the screenshot runner all drive.

    npm run rt:ios:swift    # write it, and nothing else
