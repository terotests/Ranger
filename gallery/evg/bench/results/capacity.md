# How many points fit

One chart, headless, no browser: the Vela runtime and its SVG renderer against the reference implementation's, both measured the same way (`view.toSVG()` for vega). Node v22.22.2, budget 20000 ms per render.

The number that matters is not one number: a scatter of N points is N marks and N elements, a line through N points is ONE mark and one element with N vertices, and the two differ by more than an order of magnitude.

## The ceiling, by what the chart is made of

| shape | what it is | ≤ 100 ms | ≤ 1 s | ≤ 10 s | largest measured |
|---|---|---:|---:|---:|---|
| `scatter` | N point marks, four colour series — one <path> each | 1 000 | 10 000 | 100 000 | 300 000 in 23.3 s |
| `scatter-plain` | N point marks, one colour — the same without a colour scale | 1 000 | 10 000 | 30 000 | 1 000 000 in 99.9 s |
| `line` | one line through N points — ONE mark, one <path> with N vertices | 1 000 | 30 000 | 300 000 | 1 000 000 in 21.7 s |
| `line-8` | eight lines of N/8 points — eight paths | 3 000 | 30 000 | 300 000 | 1 000 000 in 29.2 s |
| `tick` | N tick marks — a strip plot, one rule each | 3 000 | 30 000 | 100 000 | 1 000 000 in 43.5 s |
| `rect` | N rect cells — a heat map, one <path> each | — | 10 000 | 100 000 | 1 000 000 in 38.7 s |
| `area` | one filled area over N points — one path, 2N vertices | 1 000 | 30 000 | 300 000 | 1 000 000 in 34.8 s |

## `scatter` — N point marks, four colour series — one <path> each

| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 000 | 63 ms | 41 ms | 20 ms | 1 099 | 0 MB | 51 ms | 1.24× |
| 3 000 | 161 ms | 80 ms | 74 ms | 3 099 | 1 MB | 134 ms | 1.20× |
| 10 000 | 531 ms | 226 ms | 273 ms | 10 099 | 4 MB | 210 ms | 2.53× |
| 30 000 | 1664 ms | 585 ms | 984 ms | 30 099 | 11 MB | 653 ms | 2.55× |
| 100 000 | 4753 ms | 1736 ms | 2716 ms | 100 099 | 38 MB | 2117 ms | 2.25× |
| 300 000 | 23311 ms | 7326 ms | 14938 ms | 300 099 | 114 MB | 14121 ms | 1.65× |

## `scatter-plain` — N point marks, one colour — the same without a colour scale

| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 000 | 34 ms | 26 ms | 6 ms | 1 095 | 0 MB | 39 ms | 0.87× |
| 3 000 | 124 ms | 55 ms | 65 ms | 3 082 | 1 MB | 91 ms | 1.36× |
| 10 000 | 670 ms | 229 ms | 416 ms | 10 090 | 4 MB | 354 ms | 1.89× |
| 30 000 | 2592 ms | 734 ms | 1753 ms | 30 082 | 11 MB | 1523 ms | 1.70× |
| 100 000 | 10872 ms | 2633 ms | 7558 ms | 100 090 | 38 MB | 5446 ms | 2.00× |
| 300 000 | 19406 ms | 8552 ms | 8396 ms | 300 082 | 114 MB | 8073 ms | 2.40× |
| 1 000 000 | 99902 ms | 18880 ms | 77959 ms | 1 000 090 | 379 MB | 28440 ms | 3.51× |

## `line` — one line through N points — ONE mark, one <path> with N vertices

| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 000 | 53 ms | 43 ms | 6 ms | 96 | 0 MB | 38 ms | 1.39× |
| 3 000 | 104 ms | 89 ms | 9 ms | 83 | 0 MB | 69 ms | 1.51× |
| 10 000 | 248 ms | 181 ms | 33 ms | 91 | 0 MB | 95 ms | 2.61× |
| 30 000 | 742 ms | 567 ms | 66 ms | 83 | 0 MB | 257 ms | 2.89× |
| 100 000 | 3287 ms | 2330 ms | 643 ms | 91 | 2 MB | 1568 ms | 2.10× |
| 300 000 | 7090 ms | 5359 ms | 758 ms | 83 | 5 MB | 3064 ms | 2.31× |
| 1 000 000 | 21718 ms | 15410 ms | 3015 ms | 91 | 17 MB | 11981 ms | 1.81× |

## `line-8` — eight lines of N/8 points — eight paths

| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 000 | 191 ms | 182 ms | 2 ms | 109 | 0 MB | 41 ms | 4.66× |
| 3 000 | 73 ms | 64 ms | 5 ms | 120 | 0 MB | 57 ms | 1.28× |
| 10 000 | 209 ms | 177 ms | 12 ms | 102 | 0 MB | 69 ms | 3.03× |
| 30 000 | 595 ms | 492 ms | 36 ms | 120 | 0 MB | 261 ms | 2.28× |
| 100 000 | 2091 ms | 1679 ms | 165 ms | 102 | 2 MB | 869 ms | 2.41× |
| 300 000 | 7222 ms | 5896 ms | 584 ms | 115 | 5 MB | 2468 ms | 2.93× |
| 1 000 000 | 29223 ms | 21696 ms | 3470 ms | 102 | 18 MB | 17836 ms | 1.64× |

## `tick` — N tick marks — a strip plot, one rule each

| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 000 | 41 ms | 30 ms | 9 ms | 1 062 | 0 MB | 36 ms | 1.14× |
| 3 000 | 97 ms | 55 ms | 37 ms | 3 062 | 1 MB | 85 ms | 1.14× |
| 10 000 | 346 ms | 193 ms | 125 ms | 10 062 | 2 MB | 155 ms | 2.23× |
| 30 000 | 971 ms | 420 ms | 458 ms | 30 062 | 5 MB | 447 ms | 2.17× |
| 100 000 | 2902 ms | 1396 ms | 1214 ms | 100 062 | 17 MB | 1927 ms | 1.51× |
| 300 000 | 12939 ms | 4740 ms | 3902 ms | 300 062 | 50 MB | 5878 ms | 2.20× |
| 1 000 000 | 43532 ms | 19546 ms | 20135 ms | 1 000 062 | 167 MB | 21740 ms | 2.00× |

## `rect` — N rect cells — a heat map, one <path> each

| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 000 | 102 ms | 71 ms | 27 ms | 1 180 | 0 MB | 56 ms | 1.82× |
| 3 000 | 171 ms | 107 ms | 50 ms | 3 272 | 1 MB | 99 ms | 1.73× |
| 10 000 | 421 ms | 270 ms | 126 ms | 10 452 | 2 MB | 170 ms | 2.48× |
| 30 000 | 1092 ms | 652 ms | 354 ms | 30 673 | 6 MB | 515 ms | 2.12× |
| 100 000 | 3777 ms | 2319 ms | 1163 ms | 101 172 | 19 MB | 1807 ms | 2.09× |
| 300 000 | 12107 ms | 7118 ms | 4047 ms | 302 244 | 57 MB | 6215 ms | 1.95× |
| 1 000 000 | 38729 ms | 22028 ms | 14081 ms | 1 004 052 | 165 MB | 23274 ms | 1.66× |

## `area` — one filled area over N points — one path, 2N vertices

| points | vela total | scene | svg | elements | svg size | vega total | vela ÷ vega |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 000 | 61 ms | 54 ms | 5 ms | 96 | 0 MB | 25 ms | 2.44× |
| 3 000 | 105 ms | 73 ms | 28 ms | 83 | 0 MB | 56 ms | 1.88× |
| 10 000 | 332 ms | 249 ms | 72 ms | 91 | 0 MB | 300 ms | 1.11× |
| 30 000 | 704 ms | 481 ms | 164 ms | 83 | 1 MB | 370 ms | 1.90× |
| 100 000 | 2373 ms | 1532 ms | 635 ms | 91 | 3 MB | 1050 ms | 2.26× |
| 300 000 | 7536 ms | 5270 ms | 1632 ms | 83 | 9 MB | 4645 ms | 1.62× |
| 1 000 000 | 34842 ms | 19313 ms | 12330 ms | 91 | 31 MB | 16387 ms | 2.13× |
