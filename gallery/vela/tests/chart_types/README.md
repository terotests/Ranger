# Chart types, against two other libraries' catalogues

Every specification here stands for a chart type some other library offers by
name, and exists to answer one question: **does Vela draw it, and does it draw
it the way the reference does?**

```bash
npm run vela:types      # compile each one in Ranger and in official Vega-Lite,
                        # run both, and compare the scenes
```

That is `tools/reference/compiler.mjs` pointed at this directory rather than at
`tests/specs`. It is a **measurement, not a gate** — like `vela:coverage`, the
number going down is the news — and it needs the reference installed
(`npm install --no-save vega vega-lite`).

The catalogues are [Syncfusion's chart types](https://ej2.syncfusion.com/documentation/api/chart/chartseriestype)
(Chart, AccumulationChart and StockChart) and
[Observable Plot's marks](https://observablehq.com/plot/api). The data is
invented and tiny on purpose: what is being tested is the type, not the numbers.

| spec | stands for |
| --- | --- |
| `line`, `spline`, `stepline` | Line, Spline, StepLine |
| `area`, `splinearea`, `steparea` | Area, SplineArea, StepArea |
| `rangearea`, `rangecolumn` | RangeArea, RangeColumn |
| `stackedarea`, `stackedarea100` | StackingArea, StackingArea100 |
| `stackedline` | StackingLine — a line stacks only when the chart says so |
| `column`, `stackedcolumn`, `stackedcolumn100`, `groupedcolumn` | Column and its stacks |
| `bar_horizontal` | Bar (Syncfusion's bar is the horizontal one) |
| `histogram` | Histogram |
| `scatter`, `bubble` | Scatter, Bubble |
| `pie`, `doughnut`, `semipie`, `radial` | the AccumulationChart family |
| `hilo`, `hilo_open_close`, `candlestick` | the StockChart series |
| `waterfall` | Waterfall |
| `boxplot`, `errorbar`, `errorband` | BoxAndWhisker, error bars |
| `pareto` | Pareto — a bar and a cumulative line on two y axes |
| `bullet` | the Bullet Chart control, drawn as layers |
| `sparkline` | the Sparkline control |
| `heatmap` | the HeatMap control |
| `multicolored_line` | MultiColoredLine |
| `polar_column`, `polar_stacked` | a polar column and a rose — theta as a CATEGORY, one band of the circle per category |

What the report says today, and what each remaining difference is, is written
up in [`../../CHART_API.md`](../../CHART_API.md#what-two-other-catalogues-say-is-missing).
