# npm JPEG scaler wrappers (bench only)

Tiny CLIs used by `../jpeg_scaler_bench.sh` so Ranger can be timed against
packages people actually `npm install`. This folder is **not** a Ranger
runtime dependency.

| Wrapper | Package | What it is |
| --- | --- | --- |
| `scale-jimp.cjs` | `jimp` 0.22 | Pure JS image library (JPEG via `jpeg-js`) |
| `scale-jpegjs.cjs` | `jpeg-js` 0.4 | Pure JS JPEG decode/encode + bilinear resize |
| `scale-imagejs.cjs` | `image-js` 0.35 | Pure JS image library |
| `scale-sharp.cjs` | `sharp` 0.33 | Native libvips addon |

```bash
node scale-jimp.cjs 800 in.jpg out.jpg
```

`npm install` here (or let the bench script do it). Do not add these to the
repo-root `package.json`.
