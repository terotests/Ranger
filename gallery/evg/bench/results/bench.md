# Chart backends by node count

Renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` · up to 15 timed frames per backend · dpr 1 · 600×400 scatter plot, one point mark per node.

## Total time to the first picture (ms)

Everything: the Vela runtime, the emitter, the JSON parse, attaching what came out and one frame. The three GPU columns and `svg-evg` share the EVG pipeline, which is what dominates them.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 113 | 221 | 208 | 237 | 215 | 201 |
| 300 | 71 | 190 | 157 | 172 | 178 | 153 |
| 1000 | 121 | 568 | 464 | 502 | 491 | 450 |
| 3000 | 471 | 1514 | 1159 | 1295 | 1271 | 1112 |
| 10000 | 1684 | 5831 | 4116 | 4703 | 4656 | 3943 |
| 30000 | 5494 | 22546 | 13415 | 16870 | 14524 | 12748 |

## Attach and first paint (ms)

The browser's half only: the SVG string and the display list already exist.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 13.9 | 13.8 | 4.2 | 37.4 | 14.9 | 1.4 |
| 300 | 6.3 | 15.3 | 4.6 | 20.4 | 25.9 | 1.1 |
| 1000 | 21.6 | 48.7 | 14.7 | 55.6 | 44.6 | 3.0 |
| 3000 | 38.1 | 135.8 | 43.9 | 188.5 | 165.0 | 6.0 |
| 10000 | 190.0 | 857.7 | 129.0 | 787.6 | 741.3 | 27.7 |
| 30000 | 1307.7 | 4849.6 | 468.0 | 4166.7 | 1820.8 | 45.2 |

## Redraw — one frame with every node touched (ms, median)

An empty canvas of the same size costs a frame of its own here — the `gl-empty` column — because this machine has no GPU and the surface is rasterised and copied in software.

| nodes | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf | gl-empty | best DOM ÷ webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 4.30 | 9.10 | 3.80 | 82.60 | 73.00 | 15.40 | 4.00 | 0.25× |
| 300 | 7.20 | 22.90 | 6.80 | 190.50 | 158.40 | 18.00 | 4.20 | 0.38× |
| 1000 | 13.80 | 61.60 | 13.70 | 552.40 | 615.90 | 33.20 | 3.60 | 0.41× |
| 3000 | 38.70 | 174.60 | 34.70 | 1418.70 | 1386.20 | 125.20 | 4.10 | 0.28× |
| 10000 | 135.90 | 557.30 | 140.00 | 4872.60 | 4926.60 | 355.25 | 4.40 | 0.38× |
| 30000 | 644.60 | 1606.20 | 364.40 | 13839.10 | 15062.10 | 747.90 | 5.20 | 0.49× |

## Where a redraw goes (ms, median)

`cpu` is the JavaScript half — mutating the nodes and forcing style and layout for the DOM backends, building and submitting the frame for the GPU ones. Everything else in the frame above is rasterising and compositing, which is the part this machine does in software.

| nodes | svg-vela cpu | svg-evg cpu | html-evg cpu | webgl cpu | webgl-batch cpu | webgl-sdf cpu |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 1.30 | 1.50 | 1.10 | 7.20 | 0.40 | 0.10 |
| 300 | 2.20 | 2.30 | 1.90 | 17.60 | 0.90 | 0.10 |
| 1000 | 4.50 | 6.00 | 4.50 | 56.00 | 2.80 | 0.10 |
| 3000 | 13.30 | 16.80 | 13.00 | 159.30 | 13.60 | 0.40 |
| 10000 | 49.60 | 43.05 | 43.00 | 544.30 | 54.00 | 0.20 |
| 30000 | 187.40 | 140.40 | 128.70 | 1599.30 | 160.20 | 0.60 |

## Marginal cost per node (µs), from the two biggest sizes

How much one more mark costs, redraw and JavaScript separately.

| 10000 → 30000 | svg-vela | svg-evg | html-evg | webgl | webgl-batch | webgl-sdf |
|---:|---:|---:|---:|---:|---:|---:|
| frame | 25.4 | 52.4 | 11.2 | 448.3 | 506.8 | 19.6 |
| cpu | 6.9 | 4.9 | 4.3 | 52.8 | 5.3 | 0.0 |

## The scene itself

| nodes | vela cmds | display cmds | polygon points | vela svg | display list json |
|---:|---:|---:|---:|---:|---:|
| 100 | 235 | 141 | 20212 | 53 KB | 281 KB |
| 300 | 435 | 341 | 58812 | 130 KB | 814 KB |
| 1000 | 1135 | 1041 | 193912 | 401 KB | 2682 KB |
| 3000 | 3135 | 3041 | 579912 | 1176 KB | 8016 KB |
| 10000 | 10135 | 10041 | 1930912 | 3888 KB | 26684 KB |
| 30000 | 30135 | 30041 | 5790912 | 11638 KB | 80028 KB |
