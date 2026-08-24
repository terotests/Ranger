# Ranger against Vega and Chart.js

vega 6.4.0 · vega-lite 6.4.3 · chart.js 4.5.1 · dpr 1 · median of 3 first renders and up to 12 updates per size · 600×400 scatter plot, four series.

Vela and Vega are given the same Vega-Lite specification and compile it themselves. `vela-svg-vg` is the same Vela renderer handed the Vega specification *vega-lite* compiled, so the gap between it and `vela-svg` is Vela's own Vega-Lite compiler. Chart.js has no grammar, so it is handed the four series directly with animation off.

## Specification and data to a picture (ms)

| nodes | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 18.5 | 15.4 | 90.3 | 28.8 | 21.6 | 7.7 |
| 300 | 41.6 | 29.2 | 243.3 | 30.7 | 25.5 | 12.3 |
| 1000 | 91.1 | 75.9 | 808.2 | 50.1 | 30.4 | 17.4 |
| 3000 | 303.7 | 225.2 | 2150.3 | 123.9 | 58.2 | 22.8 |
| 10000 | 1198.9 | 1046.5 | 8626.3 | 404.2 | 160.3 | 74.9 |
| 30000 | 4301.1 | 4213.7 | 23385.9 | 1394.2 | 453.7 | 119.6 |

## New numbers to a new picture (ms, median)

Every point moves. Vega keeps its dataflow and reuses what it can; Chart.js keeps its chart and swaps the datasets; Ranger has no incremental path, so both of its columns run the whole pipeline again.

| nodes | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs | vela-svg ÷ best other |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 20.9 | 15.3 | 97.0 | 11.6 | 4.0 | 4.4 | 5.2× |
| 300 | 31.7 | 32.5 | 258.5 | 17.2 | 8.4 | 5.2 | 6.2× |
| 1000 | 90.7 | 78.0 | 693.7 | 38.8 | 17.3 | 10.3 | 8.8× |
| 3000 | 298.1 | 227.5 | 2527.1 | 120.3 | 45.3 | 8.9 | 33.5× |
| 10000 | 1219.5 | 1078.6 | 9039.6 | 422.4 | 151.5 | 48.0 | 25.4× |
| 30000 | 4138.5 | 3487.6 | 26668.0 | 1385.5 | 516.1 | 62.4 | 66.3× |

## Marginal cost per node (µs)

A least-squares slope over every size measured, rather than a difference between the last two — one noisy reading at one size should not decide the number.

|  | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|---:|---:|
| first render | 143.8 | 141.1 | 783.4 | 45.9 | 14.5 | 3.7 |
| update | 138.6 | 117.1 | 892.2 | 46.1 | 17.1 | 2.0 |

## What each one put on the page

| nodes | vela-svg nodes | vela-svg-vg nodes | evg-webgl nodes | vega-svg nodes | vega-canvas nodes | chartjs nodes |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 204 | 204 | 141 | 234 | 105 | 100 |
| 300 | 404 | 404 | 341 | 434 | 305 | 300 |
| 1000 | 1104 | 1104 | 1041 | 1134 | 1005 | 1000 |
| 3000 | 3104 | 3104 | 3041 | 3134 | 3005 | 3000 |
| 10000 | 10104 | 10104 | 10041 | 10134 | 10005 | 10000 |
| 30000 | 30104 | 30104 | 30041 | 30134 | 30005 | 30000 |
