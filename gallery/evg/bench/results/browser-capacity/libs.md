# Ranger against Vega and Chart.js

vega 6.4.0 · vega-lite 6.4.3 · chart.js 4.5.1 · dpr 1 · median of 1 first renders and up to 3 updates per size · 600×400 scatter plot, four series.

Vela and Vega are given the same Vega-Lite specification and compile it themselves. `vela-svg-vg` is the same Vela renderer handed the Vega specification *vega-lite* compiled, so the gap between it and `vela-svg` is Vela's own Vega-Lite compiler. Chart.js has no grammar, so it is handed the four series directly with animation off.

## Specification and data to a picture (ms)

| nodes | vela-svg | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|
| 10000 | 699.2 | 340.0 | 206.7 | 75.5 |
| 30000 | 1764.8 | 925.3 | 388.1 | 127.3 |
| 100000 | 5770.3 | 3087.9 | 1458.9 | 931.2 |
| 300000 | 18339.2 | 13305.1 | 4066.0 | 1521.8 |

## New numbers to a new picture (ms, median)

Every point moves. Vega keeps its dataflow and reuses what it can; Chart.js keeps its chart and swaps the datasets; Ranger has no incremental path, so both of its columns run the whole pipeline again.

| nodes | vela-svg | vega-svg | vega-canvas | chartjs | vela-svg ÷ best other |
|---:|---:|---:|---:|---:|---:|
| 10000 | 591.1 | 444.0 | 152.0 | 44.4 | 13.3× |
| 30000 | 1892.0 | 1407.7 | 443.0 | 71.0 | 26.6× |
| 100000 | 8169.7 | 5427.0 | 2083.7 | 408.6 | 20.0× |
| 300000 | 24062.0 | 14446.2 | 5593.9 | 715.8 | 33.6× |

## Marginal cost per node (µs)

A least-squares slope over every size measured, rather than a difference between the last two — one noisy reading at one size should not decide the number.

|  | vela-svg | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|
| first render | 61.1 | 45.4 | 13.4 | 5.0 |
| update | 81.4 | 48.2 | 18.8 | 2.3 |

## What each one put on the page

| nodes | vela-svg nodes | vega-svg nodes | vega-canvas nodes | chartjs nodes |
|---:|---:|---:|---:|---:|
| 10000 | 10104 | 10134 | 10005 | 10000 |
| 30000 | 30104 | 30134 | 30005 | 30000 |
| 100000 | 100104 | 100134 | 100005 | 100000 |
| 300000 | 300104 | 300134 | 300005 | 300000 |
