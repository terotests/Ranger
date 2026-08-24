# Ranger against Vega and Chart.js

vega 6.4.0 · vega-lite 6.4.3 · chart.js 4.5.1 · dpr 1 · median of 1 first renders and up to 3 updates per size · 600×400 scatter plot, four series.

Vela and Vega are given the same Vega-Lite specification and compile it themselves. `vela-svg-vg` is the same Vela renderer handed the Vega specification *vega-lite* compiled, so the gap between it and `vela-svg` is Vela's own Vega-Lite compiler. Chart.js has no grammar, so it is handed the four series directly with animation off.

## Specification and data to a picture (ms)

| nodes | vela-svg | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|
| 10000 | 1019.8 | 198.6 | 149.5 | 79.9 |
| 30000 | 2624.5 | 887.9 | 428.7 | 171.9 |
| 100000 | 12127.6 | 3303.4 | 1210.8 | 843.7 |
| 300000 | 35366.3 | 21922.1 | 4962.5 | 1657.9 |

## New numbers to a new picture (ms, median)

Every point moves. Vega keeps its dataflow and reuses what it can; Chart.js keeps its chart and swaps the datasets; Ranger has no incremental path, so both of its columns run the whole pipeline again.

| nodes | vela-svg | vega-svg | vega-canvas | chartjs | vela-svg ÷ best other |
|---:|---:|---:|---:|---:|---:|
| 10000 | 911.1 | 477.1 | 156.3 | 44.7 | 20.4× |
| 30000 | 3552.4 | 1498.5 | 515.7 | 70.8 | 50.2× |
| 100000 | 10113.4 | 5447.1 | 1627.0 | 420.9 | 24.0× |
| 300000 | 40038.0 | 17380.5 | 6066.6 | 762.3 | 52.5× |

## Marginal cost per node (µs)

A least-squares slope over every size measured, rather than a difference between the last two — one noisy reading at one size should not decide the number.

|  | vela-svg | vega-svg | vega-canvas | chartjs |
|---:|---:|---:|---:|---:|
| first render | 119.5 | 76.8 | 16.8 | 5.4 |
| update | 135.6 | 58.6 | 20.5 | 2.5 |

## What each one put on the page

| nodes | vela-svg nodes | vega-svg nodes | vega-canvas nodes | chartjs nodes |
|---:|---:|---:|---:|---:|
| 10000 | 10104 | 10134 | 10005 | 10000 |
| 30000 | 30104 | 30134 | 30005 | 30000 |
| 100000 | 100104 | 100134 | 100005 | 100000 |
| 300000 | 300104 | 300134 | 300005 | 300000 |
