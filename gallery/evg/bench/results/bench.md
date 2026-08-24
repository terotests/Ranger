# Chart backends by node count

Renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` · up to 15 timed frames per backend · dpr 1 · 600×400 scatter plot, one point mark per node.

## Total time to the first picture (ms)

Everything: the Vela runtime, the emitter, the JSON parse, attaching what came out and one frame. The three GPU columns and `svg-evg` share the EVG pipeline, which is what dominates them.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 60 | 153 | 141 | 165 | 144 | 136 |
| 300 | 47 | 156 | 129 | 138 | 143 | 123 |
| 1000 | 85 | 387 | 279 | 312 | 325 | 261 |
| 3000 | 167 | 1188 | 838 | 1017 | 950 | 799 |
| 10000 | 931 | 4827 | 3780 | 4110 | 3992 | 3584 |
| 30000 | 2938 | 18879 | 11596 | 13209 | 12537 | 11061 |

## Attach and first paint (ms)

The browser's half only: the SVG string and the display list already exist.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 9.9 | 11.0 | 5.0 | 31.0 | 9.8 | 1.6 |
| 300 | 7.0 | 15.1 | 5.3 | 15.0 | 20.0 | 0.7 |
| 1000 | 20.0 | 50.7 | 18.1 | 53.2 | 66.0 | 1.9 |
| 3000 | 38.7 | 148.6 | 41.1 | 227.9 | 160.2 | 9.3 |
| 10000 | 155.5 | 461.6 | 143.6 | 542.3 | 424.0 | 16.6 |
| 30000 | 768.8 | 4695.0 | 465.9 | 2206.7 | 1535.2 | 59.2 |

## Redraw — one frame with every node touched (ms, median)

An empty canvas of the same size costs a frame of its own here — the `gl-empty` column — because this machine has no GPU and the surface is rasterised and copied in software.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf | gl-empty | best DOM ÷ webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 4.80 | 8.70 | 4.60 | 90.70 | 71.40 | 15.70 | 4.60 | 0.29× |
| 300 | 6.20 | 20.80 | 4.70 | 192.00 | 158.90 | 18.40 | 3.40 | 0.26× |
| 1000 | 15.10 | 61.10 | 12.10 | 692.35 | 446.30 | 37.70 | 3.90 | 0.32× |
| 3000 | 44.60 | 164.70 | 39.90 | 1712.50 | 1454.00 | 85.90 | 3.90 | 0.46× |
| 10000 | 136.80 | 558.85 | 124.40 | 5012.80 | 4851.00 | 243.30 | 3.90 | 0.51× |
| 30000 | 766.65 | 1754.40 | 384.00 | 15549.80 | 14107.90 | 748.80 | 3.60 | 0.51× |

## Where a redraw goes (ms, median)

`cpu` is the JavaScript half — mutating the nodes and forcing style and layout for the DOM backends, building and submitting the frame for the GPU ones. Everything else in the frame above is rasterising and compositing, which is the part this machine does in software.

| nodes | svg-vela cpu | svg-evg cpu | html-evg cpu | webgl cpu | webgl-batch cpu | webgl-sdf cpu |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 1.50 | 1.40 | 1.60 | 7.10 | 0.50 | 0.10 |
| 300 | 1.90 | 2.20 | 1.50 | 15.80 | 0.90 | 0.10 |
| 1000 | 4.90 | 6.10 | 4.20 | 50.15 | 2.70 | 0.20 |
| 3000 | 15.40 | 14.80 | 14.50 | 170.60 | 14.20 | 0.40 |
| 10000 | 49.20 | 46.90 | 40.20 | 577.50 | 62.30 | 0.20 |
| 30000 | 211.10 | 136.80 | 136.80 | 1961.80 | 173.90 | 0.65 |

## Marginal cost per node (µs), from the two biggest sizes

How much one more mark costs, redraw and JavaScript separately.

| 10000 → 30000 | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| frame | 31.5 | 59.8 | 13.0 | 526.9 | 462.8 | 25.3 |
| cpu | 8.1 | 4.5 | 4.8 | 69.2 | 5.6 | 0.0 |

## The scene itself

| nodes | vela cmds | display cmds | polygon points | vela svg | display list json |
|---:|---:|---:|---:|---:|---:|
| 100 | 235 | 141 | 20212 | 53 KB | 281 KB |
| 300 | 435 | 341 | 58812 | 130 KB | 814 KB |
| 1000 | 1135 | 1041 | 193912 | 401 KB | 2682 KB |
| 3000 | 3135 | 3041 | 579912 | 1176 KB | 8016 KB |
| 10000 | 10135 | 10041 | 1930912 | 3888 KB | 26684 KB |
| 30000 | 30135 | 30041 | 5790912 | 11638 KB | 80028 KB |
