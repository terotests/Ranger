# Ranger against Vega and Chart.js

vega 6.4.0 · vega-lite 6.4.3 · chart.js 4.5.1 · dpr 1 · median of 3 first renders and up to 12 updates per size · 600×400 scatter plot, four series.

Vela and Vega are given the same Vega-Lite specification and compile it themselves. `vela-svg-vg` is the same Vela renderer handed the Vega specification *vega-lite* compiled, so the gap between it and `vela-svg` is Vela's own Vega-Lite compiler. Chart.js has no grammar, so it is handed the four series directly with animation off.

## Specification and data to a picture (ms)

| nodes | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 12.6 | 13.0 | 111.0 | 20.1 | 18.5 | 11.0 |
| 300 | 23.5 | 20.3 | 222.5 | 26.5 | 20.9 | 9.1 |
| 1000 | 55.6 | 50.9 | 803.3 | 46.7 | 30.3 | 12.8 |
| 3000 | 171.8 | 141.8 | 2200.2 | 118.9 | 56.5 | 16.2 |
| 10000 | 605.7 | 650.6 | 10439.5 | 360.7 | 155.3 | 60.8 |
| 30000 | 2138.7 | 1964.8 | 26531.3 | 1288.6 | 428.3 | 161.6 |

## New numbers to a new picture (ms, median)

Every point moves. Vega keeps its dataflow and reuses what it can; Chart.js keeps its chart and swaps the datasets; Ranger has no incremental path, so both of its columns run the whole pipeline again.

| nodes | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs | vela-svg ÷ best other |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 11.9 | 13.6 | 92.1 | 9.1 | 4.4 | 3.9 | 3.1× |
| 300 | 22.2 | 21.2 | 251.6 | 15.1 | 7.0 | 4.8 | 4.6× |
| 1000 | 56.7 | 57.4 | 804.0 | 37.1 | 16.1 | 9.7 | 5.9× |
| 3000 | 179.7 | 186.0 | 2278.7 | 107.8 | 45.9 | 8.6 | 20.8× |
| 10000 | 635.2 | 595.1 | 8071.0 | 417.1 | 165.9 | 43.2 | 14.7× |
| 30000 | 2109.4 | 1812.1 | 25161.6 | 1457.2 | 541.1 | 65.5 | 32.2× |

## Marginal cost per node (µs)

A least-squares slope over every size measured, rather than a difference between the last two — one noisy reading at one size should not decide the number.

|  | vela-svg | vela-svg-vg | evg-webgl | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|---:|---:|
| first render | 71.2 | 65.9 | 894.4 | 42.4 | 13.7 | 5.2 |
| update | 70.3 | 60.3 | 839.3 | 48.6 | 18.0 | 2.1 |

## What each one put on the page

| nodes | vela-svg nodes | vela-svg-vg nodes | evg-webgl nodes | vega-svg nodes | vega-canvas nodes | chartjs nodes |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 204 | 204 | 141 | 234 | 105 | 100 |
| 300 | 404 | 404 | 341 | 434 | 305 | 300 |
| 1000 | 1104 | 1104 | 1041 | 1134 | 1005 | 1000 |
| 3000 | 3104 | 3104 | 3041 | 3134 | 3005 | 3000 |
| 10000 | 10104 | 10104 | 10041 | 10134 | 10005 | 10000 |
| 30000 | 30104 | 30104 | 30041 | 30134 | 30005 | 30000 |
