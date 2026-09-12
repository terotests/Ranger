# A picture is bytes

A markdown layout used to draw `![alt](src)` as its ALT TEXT, in the muted
colour, because it had no bytes for a picture. That was the most honest thing
to draw and it was the blocker under images, background images and every CSS
`url(...)`.

![Kaksisataa neljäkymmentä pikseliä leveä liukuväri](logo.png)

Now it reads the bytes out of the byte store the editor was given, sizes the
picture from what the store says it is, and carries it into the PDF and the
deck. The preview and the file ask the same store, so they cannot be missing
different pictures.

A picture nobody can find is still alt text, and says so:

![Tätä ei ole](nope.png)
