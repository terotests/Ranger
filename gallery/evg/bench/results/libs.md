# Ranger against Vega and Chart.js

vega 6.4.0 · vega-lite 6.4.3 · chart.js 4.5.1 · dpr 1 · median of 3 first renders and up to 12 updates per size · 600×400 scatter plot, four series.

Vela and Vega are given the same Vega-Lite specification and compile it themselves. `vela-svg-vg` is the same Vela renderer handed the Vega specification *vega-lite* compiled, so the gap between it and `vela-svg` is Vela's own Vega-Lite compiler. Chart.js has no grammar, so it is handed the four series directly with animation off.

## Specification and data to a picture (ms)

| nodes | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 35.2 | 16.5 | 106.8 | 32.6 | 22.0 | 10.4 |
| 300 | 29.4 | 20.1 | 279.6 | 28.9 | 23.3 | 9.9 |
| 1000 | 82.2 | 58.5 | 884.5 | 69.0 | 36.7 | 20.6 |
| 3000 | 122.9 | 176.2 | 2537.5 | 141.3 | 80.1 | 29.1 |
| 10000 | 675.6 | 534.0 | 8102.7 | 452.2 | 166.9 | 79.5 |
| 30000 | 1995.3 | 1615.6 | 28380.9 | 1190.5 | 398.2 | 118.2 |

## New numbers to a new picture (ms, median)

Every point moves. Vega keeps its dataflow and reuses what it can; Chart.js keeps its chart and swaps the datasets; Ranger has no incremental path, so both of its columns run the whole pipeline again.

| nodes | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs | vela-svg ÷ best other |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 13.9 | 14.1 | 106.1 | 11.2 | 6.0 | 6.8 | 2.3× |
| 300 | 21.6 | 22.6 | 271.2 | 17.2 | 13.5 | 7.3 | 3.0× |
| 1000 | 57.1 | 51.7 | 853.9 | 60.2 | 24.3 | 10.4 | 5.5× |
| 3000 | 159.3 | 192.4 | 2779.0 | 124.7 | 50.1 | 11.0 | 14.5× |
| 10000 | 600.4 | 559.8 | 7837.1 | 511.1 | 172.8 | 48.8 | 12.3× |
| 30000 | 1868.3 | 1950.6 | 27249.3 | 1505.6 | 455.7 | 61.6 | 30.3× |

## Marginal cost per node (µs)

A least-squares slope over every size measured, rather than a difference between the last two — one noisy reading at one size should not decide the number.

|  | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|---:|---:|
| first render | 66.5 | 53.5 | 943.3 | 39.0 | 12.5 | 3.6 |
| update | 62.3 | 64.7 | 903.6 | 50.2 | 15.0 | 1.9 |

## What each one put on the page

| nodes | vela-svg nodes | vela-svg-vg nodes | evg-webgl nodes | vega-svg nodes | vega-canvas nodes | chartjs nodes |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 204 | 204 | 141 | 234 | 105 | 100 |
| 300 | 404 | 404 | 341 | 434 | 305 | 300 |
| 1000 | 1104 | 1104 | 1041 | 1134 | 1005 | 1000 |
| 3000 | 3104 | 3104 | 3041 | 3134 | 3005 | 3000 |
| 10000 | 10104 | 10104 | 10041 | 10134 | 10005 | 10000 |
| 30000 | 30104 | 30104 | 30041 | 30134 | 30005 | 30000 |
