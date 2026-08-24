# Chart backends by node count

Renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` · up to 15 timed frames per backend · dpr 1 · 600×400 scatter plot, one point mark per node.

## Total time to the first picture (ms)

Everything: the Vela runtime, the emitter, the JSON parse, attaching what came out and one frame. The three GPU columns and `svg-evg` share the EVG pipeline, which is what dominates them.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 62 | 163 | 149 | 180 | 151 | 142 |
| 300 | 56 | 210 | 169 | 205 | 192 | 162 |
| 1000 | 91 | 493 | 357 | 406 | 378 | 338 |
| 3000 | 144 | 1554 | 1103 | 1244 | 1229 | 1068 |
| 10000 | 846 | 5482 | 4036 | 4854 | 4354 | 3865 |
| 30000 | 2533 | 17451 | 11854 | 15070 | 12977 | 11396 |

## Attach and first paint (ms)

The browser's half only: the SVG string and the display list already exist.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 10.6 | 15.2 | 7.2 | 40.6 | 11.7 | 2.1 |
| 300 | 11.0 | 25.1 | 7.0 | 44.1 | 31.5 | 1.2 |
| 1000 | 30.1 | 62.3 | 20.7 | 73.0 | 44.9 | 5.1 |
| 3000 | 43.4 | 148.4 | 43.8 | 193.1 | 178.5 | 17.3 |
| 10000 | 185.2 | 508.6 | 167.0 | 1009.4 | 509.1 | 20.4 |
| 30000 | 891.2 | 2807.6 | 385.7 | 3718.4 | 1625.1 | 43.6 |

## Redraw — one frame with every node touched (ms, median)

An empty canvas of the same size costs a frame of its own here — the `gl-empty` column — because this machine has no GPU and the surface is rasterised and copied in software.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf | gl-empty | best DOM ÷ webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 4.70 | 11.00 | 3.50 | 85.80 | 87.50 | 17.10 | 4.40 | 0.20× |
| 300 | 8.00 | 27.10 | 7.30 | 237.00 | 186.50 | 22.00 | 3.60 | 0.33× |
| 1000 | 16.40 | 60.80 | 14.30 | 641.50 | 594.50 | 42.40 | 3.90 | 0.34× |
| 3000 | 41.10 | 170.50 | 41.40 | 2007.80 | 1853.80 | 96.80 | 4.00 | 0.42× |
| 10000 | 158.60 | 541.00 | 133.80 | 6538.60 | 5588.20 | 313.90 | 4.10 | 0.43× |
| 30000 | 454.70 | 1583.50 | 342.70 | 15593.00 | 16397.30 | 751.50 | 4.60 | 0.46× |

## Where a redraw goes (ms, median)

`cpu` is the JavaScript half — mutating the nodes and forcing style and layout for the DOM backends, building and submitting the frame for the GPU ones. Everything else in the frame above is rasterising and compositing, which is the part this machine does in software.

| nodes | svg-vela cpu | svg-evg cpu | html-evg cpu | webgl cpu | webgl-batch cpu | webgl-sdf cpu |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 1.30 | 1.30 | 0.90 | 8.90 | 0.70 | 0.10 |
| 300 | 2.40 | 3.90 | 2.00 | 20.50 | 1.00 | 0.10 |
| 1000 | 5.70 | 6.50 | 5.10 | 55.70 | 2.70 | 0.20 |
| 3000 | 13.50 | 14.90 | 14.70 | 188.00 | 14.80 | 0.50 |
| 10000 | 58.50 | 42.95 | 43.60 | 591.80 | 57.90 | 0.20 |
| 30000 | 164.80 | 123.20 | 120.20 | 1785.10 | 184.30 | 0.60 |

## Marginal cost per node (µs), from the two biggest sizes

How much one more mark costs, redraw and JavaScript separately.

| 10000 → 30000 | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| frame | 14.8 | 52.1 | 10.4 | 452.7 | 540.5 | 21.9 |
| cpu | 5.3 | 4.0 | 3.8 | 59.7 | 6.3 | 0.0 |

## The scene itself

| nodes | vela cmds | display cmds | polygon points | vela svg | display list json |
|---:|---:|---:|---:|---:|---:|
| 100 | 235 | 141 | 20212 | 53 KB | 281 KB |
| 300 | 435 | 341 | 58812 | 130 KB | 814 KB |
| 1000 | 1135 | 1041 | 193912 | 401 KB | 2682 KB |
| 3000 | 3135 | 3041 | 579912 | 1176 KB | 8016 KB |
| 10000 | 10135 | 10041 | 1930912 | 3888 KB | 26684 KB |
| 30000 | 30135 | 30041 | 5790912 | 11638 KB | 80028 KB |
