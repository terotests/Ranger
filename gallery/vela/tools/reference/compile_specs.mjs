// =============================================================================
// compile_specs.mjs — the Vega-Lite sources of the test specs, and their
// compiled Vega form.
// =============================================================================
// The `.vg.json` files under tests/specs are the input Vela actually runs, and
// they are generated, not hand-written: `vegaLite.compile(spec).spec` from the
// official compiler, so they are exactly what a real Vega-Lite chart produces
// and cannot drift into something convenient.
//
//   node gallery/vela/tools/reference/compile_specs.mjs
//
// Re-run it to regenerate after a Vega-Lite version bump; the diff on the
// committed `.vg.json` files is then the upstream change, which is worth
// seeing on its own.
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = path.resolve(__dirname, '..', '..', 'tests', 'specs');

let vl;
try {
  vl = await import('vega-lite');
} catch {
  console.log('vega-lite is not installed — no specs were generated.');
  console.log('install it to regenerate:  npm install --no-save vega vega-lite');
  process.exit(0);
}

// One small data set for every chart, so a difference between two specs is the
// chart and not the numbers.
const values = [
  { a: 'A', b: 28, c: 5, g: 'x' }, { a: 'B', b: 55, c: 9, g: 'y' },
  { a: 'C', b: 43, c: 2, g: 'x' }, { a: 'D', b: 91, c: 7, g: 'y' },
  { a: 'E', b: 81, c: 4, g: 'x' }, { a: 'F', b: 53, c: 6, g: 'y' },
  { a: 'G', b: 19, c: 8, g: 'x' }, { a: 'H', b: 87, c: 1, g: 'y' },
  { a: 'I', b: 52, c: 3, g: 'x' },
];

const SPECS = {
  bar: {
    description: 'A simple bar chart with embedded data.',
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'a', type: 'nominal', axis: { labelAngle: 0 } },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  scatter: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  line: {
    data: { values },
    mark: 'line',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  area: {
    data: { values },
    mark: 'area',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  // A specification's OWN transforms, which were read by nobody: a filter that
  // removed rows simply did not happen, and nothing said so.
  transform_filter: {
        "description": "The transforms a specification writes for itself, rather than the ones its encoding implies. A filter that removes rows and a calculate that adds a field were both dropped in silence: the chart drew the untransformed data and looked entirely reasonable.",
        "width": 180,
        "height": 120,
        "data": {
            "values": [
                {
                    "a": "A",
                    "b": 28,
                    "keep": true
                },
                {
                    "a": "B",
                    "b": 55,
                    "keep": false
                },
                {
                    "a": "C",
                    "b": 43,
                    "keep": true
                },
                {
                    "a": "D",
                    "b": 91,
                    "keep": false
                },
                {
                    "a": "E",
                    "b": 81,
                    "keep": true
                },
                {
                    "a": "F",
                    "b": 53,
                    "keep": true
                }
            ]
        },
        "transform": [
            {
                "filter": "datum.keep"
            },
            {
                "calculate": "datum.b / 2",
                "as": "half"
            }
        ],
        "mark": "bar",
        "encoding": {
            "x": {
                "field": "a",
                "type": "nominal"
            },
            "y": {
                "field": "half",
                "type": "quantitative"
            }
        }
    },
  // A timeUnit, which groups every March in four years onto one bar — plus a
  // colour scale whose declared domain fixes the order of the stack.
  timeunit_month: {
        "description": "A timeUnit groups every March in four years of daily readings onto one bar. It is a substitution and not a floor \u2014 the fields the unit does not name come from a fixed reference year \u2014 and the axis labels the result as a date even though the scale is a band.",
        "width": 180,
        "height": 120,
        "data": {
            "values": [
                {
                    "date": "2012-01-14",
                    "weather": "rain"
                },
                {
                    "date": "2012-02-05",
                    "weather": "snow"
                },
                {
                    "date": "2012-03-09",
                    "weather": "sun"
                },
                {
                    "date": "2013-01-22",
                    "weather": "sun"
                },
                {
                    "date": "2013-03-11",
                    "weather": "rain"
                },
                {
                    "date": "2013-04-02",
                    "weather": "sun"
                },
                {
                    "date": "2014-02-17",
                    "weather": "rain"
                },
                {
                    "date": "2014-03-28",
                    "weather": "sun"
                },
                {
                    "date": "2014-04-19",
                    "weather": "rain"
                },
                {
                    "date": "2015-01-08",
                    "weather": "snow"
                },
                {
                    "date": "2015-03-30",
                    "weather": "sun"
                },
                {
                    "date": "2015-04-25",
                    "weather": "sun"
                }
            ]
        },
        "mark": "bar",
        "encoding": {
            "x": {
                "timeUnit": "month",
                "field": "date",
                "type": "ordinal",
                "title": "Month of the year"
            },
            "y": {
                "aggregate": "count",
                "type": "quantitative",
                "title": "Number of days"
            },
            "color": {
                "field": "weather",
                "type": "nominal",
                "scale": {
                    "domain": [
                        "sun",
                        "rain",
                        "snow"
                    ],
                    "range": [
                        "#e7ba52",
                        "#1f77b4",
                        "#9467bd"
                    ]
                },
                "title": "Weather type"
            }
        }
    },
  // A smoother, which is a claim ABOUT the data: a curve that is merely
  // plausible draws a line through a scatter plot nobody can check.
  loess_line: {
        "description": "A locally-weighted regression drawn over the points it was fitted to. The curve is a claim about the data, so it is compared against the reference's own smoother rather than eyeballed.",
        "width": 180,
        "height": 120,
        "data": {
            "values": [
                {
                    "u": 1.31,
                    "v": 22.743
                },
                {
                    "u": 2.95,
                    "v": 22.957
                },
                {
                    "u": 4.233,
                    "v": 28.374
                },
                {
                    "u": 6.005,
                    "v": 29.219
                },
                {
                    "u": 6.913,
                    "v": 31.107
                },
                {
                    "u": 9.651,
                    "v": 31.048
                },
                {
                    "u": 10.196,
                    "v": 36.922
                },
                {
                    "u": 12.779,
                    "v": 41.521
                },
                {
                    "u": 14.401,
                    "v": 38.153
                },
                {
                    "u": 15.478,
                    "v": 40.776
                },
                {
                    "u": 16.5,
                    "v": 42.466
                },
                {
                    "u": 19.033,
                    "v": 45.733
                },
                {
                    "u": 19.858,
                    "v": 41.504
                },
                {
                    "u": 22.217,
                    "v": 44.516
                },
                {
                    "u": 22.746,
                    "v": 38.139
                },
                {
                    "u": 25.565,
                    "v": 38.288
                },
                {
                    "u": 26.795,
                    "v": 39.827
                },
                {
                    "u": 28.313,
                    "v": 41.734
                },
                {
                    "u": 29.595,
                    "v": 38.011
                },
                {
                    "u": 31.692,
                    "v": 41.885
                },
                {
                    "u": 32.61,
                    "v": 43.057
                },
                {
                    "u": 35.269,
                    "v": 36.526
                },
                {
                    "u": 36.61,
                    "v": 32.686
                },
                {
                    "u": 38.016,
                    "v": 34.897
                },
                {
                    "u": 39.8,
                    "v": 36.367
                },
                {
                    "u": 40.794,
                    "v": 33.896
                },
                {
                    "u": 42.837,
                    "v": 24.646
                },
                {
                    "u": 43.95,
                    "v": 23.526
                },
                {
                    "u": 45.921,
                    "v": 23.88
                },
                {
                    "u": 46.7,
                    "v": 25.784
                },
                {
                    "u": 48.144,
                    "v": 17.341
                },
                {
                    "u": 49.994,
                    "v": 22.717
                },
                {
                    "u": 52.298,
                    "v": 17.16
                },
                {
                    "u": 53.552,
                    "v": 11.876
                },
                {
                    "u": 55.307,
                    "v": 12.082
                },
                {
                    "u": 56.754,
                    "v": 8.87
                },
                {
                    "u": 59.491,
                    "v": 13.505
                },
                {
                    "u": 60.069,
                    "v": 10.246
                },
                {
                    "u": 60.842,
                    "v": 12.762
                },
                {
                    "u": 62.719,
                    "v": 6.419
                },
                {
                    "u": 65.497,
                    "v": 9.123
                },
                {
                    "u": 67.264,
                    "v": 3.868
                },
                {
                    "u": 68.597,
                    "v": 2.489
                },
                {
                    "u": 70.782,
                    "v": 2.313
                },
                {
                    "u": 70.721,
                    "v": 11.23
                },
                {
                    "u": 73.353,
                    "v": 3.092
                },
                {
                    "u": 74.083,
                    "v": 9.165
                },
                {
                    "u": 75.516,
                    "v": 12.471
                },
                {
                    "u": 77.678,
                    "v": 13.121
                },
                {
                    "u": 79.397,
                    "v": 8.082
                },
                {
                    "u": 81.562,
                    "v": 8.062
                },
                {
                    "u": 83.193,
                    "v": 12.231
                },
                {
                    "u": 83.46,
                    "v": 13.248
                },
                {
                    "u": 85.7,
                    "v": 15.275
                },
                {
                    "u": 87.883,
                    "v": 21.396
                },
                {
                    "u": 88.564,
                    "v": 18.805
                },
                {
                    "u": 90.945,
                    "v": 24.303
                },
                {
                    "u": 92.961,
                    "v": 22.833
                },
                {
                    "u": 93.067,
                    "v": 27.911
                },
                {
                    "u": 96.375,
                    "v": 28.725
                }
            ]
        },
        "layer": [
            {
                "mark": {
                    "type": "point",
                    "filled": true,
                    "opacity": 0.5
                },
                "encoding": {
                    "x": {
                        "field": "u",
                        "type": "quantitative"
                    },
                    "y": {
                        "field": "v",
                        "type": "quantitative"
                    }
                }
            },
            {
                "mark": {
                    "type": "line",
                    "color": "firebrick"
                },
                "transform": [
                    {
                        "loess": "v",
                        "on": "u"
                    }
                ],
                "encoding": {
                    "x": {
                        "field": "u",
                        "type": "quantitative"
                    },
                    "y": {
                        "field": "v",
                        "type": "quantitative"
                    }
                }
            }
        ]
    },
  // bin, aggregate and joinaggregate written by the specification rather than
  // implied by an encoding.
  spec_transforms: {
        "description": "The transforms a specification writes for itself when they are bin, aggregate and joinaggregate \u2014 all three already in the runtime, none of them reachable from a Vega-Lite source before.",
        "width": 180,
        "height": 120,
        "data": {
            "values": [
                {
                    "age": 0,
                    "sex": 1,
                    "people": 5025
                },
                {
                    "age": 0,
                    "sex": 2,
                    "people": 2482
                },
                {
                    "age": 10,
                    "sex": 1,
                    "people": 4284
                },
                {
                    "age": 10,
                    "sex": 2,
                    "people": 7803
                },
                {
                    "age": 20,
                    "sex": 1,
                    "people": 3778
                },
                {
                    "age": 20,
                    "sex": 2,
                    "people": 4814
                },
                {
                    "age": 30,
                    "sex": 1,
                    "people": 5392
                },
                {
                    "age": 30,
                    "sex": 2,
                    "people": 5038
                },
                {
                    "age": 40,
                    "sex": 1,
                    "people": 8309
                },
                {
                    "age": 40,
                    "sex": 2,
                    "people": 9300
                },
                {
                    "age": 50,
                    "sex": 1,
                    "people": 7043
                },
                {
                    "age": 50,
                    "sex": 2,
                    "people": 5815
                },
                {
                    "age": 60,
                    "sex": 1,
                    "people": 6560
                },
                {
                    "age": 60,
                    "sex": 2,
                    "people": 6988
                },
                {
                    "age": 70,
                    "sex": 1,
                    "people": 7991
                },
                {
                    "age": 70,
                    "sex": 2,
                    "people": 9213
                },
                {
                    "age": 80,
                    "sex": 1,
                    "people": 5233
                },
                {
                    "age": 80,
                    "sex": 2,
                    "people": 4810
                }
            ]
        },
        "transform": [
            {
                "bin": true,
                "field": "people",
                "as": [
                    "lo",
                    "hi"
                ]
            },
            {
                "aggregate": [
                    {
                        "op": "count",
                        "as": "n"
                    }
                ],
                "groupby": [
                    "lo",
                    "hi"
                ]
            },
            {
                "joinaggregate": [
                    {
                        "field": "n",
                        "op": "max",
                        "as": "most"
                    }
                ]
            },
            {
                "calculate": "datum.n / datum.most",
                "as": "share"
            }
        ],
        "mark": "line",
        "encoding": {
            "x": {
                "field": "n",
                "type": "quantitative"
            },
            "y": {
                "field": "share",
                "type": "quantitative"
            }
        }
    },
  tick: {
    data: { values },
    mark: 'tick',
    encoding: {
      x: { field: 'b', type: 'quantitative' },
      y: { field: 'a', type: 'nominal' },
    },
  },
  bar_stacked: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative', aggregate: 'sum' },
      color: { field: 'a', type: 'nominal' },
    },
  },
  bar_grouped: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      xOffset: { field: 'a', type: 'nominal' },
    },
  },
  bubble: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      size: { field: 'b', type: 'quantitative' },
    },
  },
  histogram: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'b', type: 'quantitative', bin: true },
      y: { aggregate: 'count' },
    },
  },
  pie: {
    data: { values },
    mark: 'arc',
    encoding: {
      theta: { field: 'b', type: 'quantitative' },
      color: { field: 'a', type: 'nominal' },
    },
  },
  text_labels: {
    data: { values },
    mark: 'text',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      text: { field: 'a', type: 'nominal' },
    },
  },
  scatter_colored: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      color: { field: 'g', type: 'nominal' },
    },
  },
  // Charts the triage found reachable, graduated into the parity set: a
  // candidate that matches the reference is not a candidate any more.
  bar_labelled: {
    data: { values },
    layer: [
      { mark: 'bar', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
      { mark: { type: 'text', dy: -6 }, encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' }, text: { field: 'b', type: 'quantitative' } } },
    ],
  },
  bar_normalized: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative', aggregate: 'sum', stack: 'normalize' },
      color: { field: 'a', type: 'nominal' },
    },
  },
  line_coloured: {
    data: { values },
    mark: 'line',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      color: { field: 'g', type: 'nominal' },
    },
  },
  line_temporal: {
    data: { values: values.map((d, i) => ({ ...d, t: `2024-0${(i % 9) + 1}-01` })) },
    mark: 'line',
    encoding: {
      x: { field: 't', type: 'temporal' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  streamgraph: {
    data: { values },
    mark: 'area',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative', stack: 'center' },
      color: { field: 'g', type: 'nominal' },
    },
  },
  heatmap: {
    data: { values },
    mark: 'rect',
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'g', type: 'nominal' },
      color: { field: 'b', type: 'quantitative' },
    },
  },
  boxplot: {
    data: { values },
    mark: 'boxplot',
    encoding: { x: { field: 'g', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
  },
  donut: {
    data: { values },
    mark: { type: 'arc', innerRadius: 30 },
    encoding: { theta: { field: 'b', type: 'quantitative' }, color: { field: 'a', type: 'nominal' } },
  },
  facet_columns: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      column: { field: 'g', type: 'nominal' },
    },
  },
  // Six-hourly readings across the European Union's spring clock change
  // (2024-03-31 01:00 UTC). Its whole job is to be drawn in more than one wall
  // clock: tools/reference/zones.mjs runs it in eight, and the hours either
  // side of a transition are where a zone implementation is wrong if it is
  // wrong anywhere. The dates are written out rather than generated so the spec
  // is the same file on every run.
  line_dst: {
    data: {
      values: Array.from({ length: 20 }, (unused, i) => ({
        t: new Date(Date.UTC(2024, 2, 30, 0) + i * 6 * 3600e3).toISOString(),
        b: 20 + (i % 7) * 9,
      })),
    },
    mark: 'line',
    encoding: {
      x: { field: 't', type: 'temporal' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  // Six-hourly readings across the European Union's 1995 autumn change, which
  // was in SEPTEMBER — the union moved it to October the following year. Its
  // whole job is to be drawn in a zone whose rule has since changed:
  // tools/reference/zones.mjs runs it in eight, and a runtime carrying only
  // each zone's current rule is an hour out on every one of these rows.
  line_historical: {
    data: {
      values: Array.from({ length: 20 }, (unused, i) => ({
        t: new Date(Date.UTC(1995, 8, 23, 0) + i * 6 * 3600e3).toISOString(),
        b: 20 + (i % 7) * 9,
      })),
    },
    mark: 'line',
    encoding: {
      x: { field: 't', type: 'temporal' },
      y: { field: 'b', type: 'quantitative' },
    },
  },
  // --- table-based plots: a grid whose cells carry the value ---------------
  // Binned on BOTH axes: a two-dimensional histogram, whose cells are counts
  // rather than values.
  heatmap_binned: {
    data: { values },
    mark: 'rect',
    encoding: {
      x: { field: 'c', type: 'quantitative', bin: true },
      y: { field: 'b', type: 'quantitative', bin: true },
      color: { aggregate: 'count', type: 'quantitative' },
    },
  },
  // A punch card: two discrete axes and a size, so the cells are dots whose
  // area is the value rather than blocks whose colour is.
  table_bubble: {
    data: { values },
    mark: 'circle',
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'g', type: 'nominal' },
      size: { field: 'b', type: 'quantitative' },
    },
  },
  heatmap_labelled: {
    data: { values },
    layer: [
      { mark: 'rect', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'g', type: 'nominal' }, color: { field: 'b', type: 'quantitative' } } },
      { mark: 'text', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'g', type: 'nominal' }, text: { field: 'b', type: 'quantitative' } } },
    ],
  },
  // --- the variants a chart type has ---------------------------------------
  bar_negative: {
    data: { values: values.map((d) => ({ ...d, b: d.b - 50 })) },
    mark: 'bar',
    encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
  },
  bar_horizontal: {
    data: { values },
    mark: 'bar',
    encoding: { y: { field: 'a', type: 'nominal' }, x: { field: 'b', type: 'quantitative' } },
  },
  bar_gantt: {
    data: { values },
    mark: 'bar',
    encoding: {
      y: { field: 'a', type: 'nominal' },
      x: { field: 'c', type: 'quantitative' },
      x2: { field: 'b' },
    },
  },
  line_step: {
    data: { values },
    mark: { type: 'line', interpolate: 'step-after' },
    encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } },
  },
  line_with_points: {
    data: { values },
    mark: { type: 'line', point: true },
    encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } },
  },
  strip_plot: {
    data: { values },
    mark: 'tick',
    encoding: { x: { field: 'b', type: 'quantitative' } },
  },
  scatter_shapes: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative' },
      shape: { field: 'g', type: 'nominal' },
    },
  },
  scatter_mean_rule: {
    data: { values },
    layer: [
      { mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
      { mark: 'rule', encoding: { y: { field: 'b', type: 'quantitative', aggregate: 'mean' } } },
    ],
  },
  radial: {
    data: { values },
    mark: { type: 'arc', innerRadius: 20 },
    encoding: {
      theta: { field: 'b', type: 'quantitative' },
      radius: { field: 'b', type: 'quantitative', scale: { type: 'sqrt', zero: true, rangeMin: 20 } },
      color: { field: 'a', type: 'nominal' },
    },
  },
  // The other two ways a trellis can be arranged. A row facet stacks the cells
  // and turns the shared title on its side; a wrapped facet has neither row
  // headers nor column headers and titles every cell instead, its grid sized by
  // a `sequence` over the facet domain.
  facet_rows: {
    data: { values },
    mark: 'bar',
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      row: { field: 'g', type: 'nominal' },
    },
  },
  facet_wrapped: {
    data: { values },
    mark: 'bar',
    columns: 2,
    encoding: {
      x: { field: 'g', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
      facet: { field: 'a', type: 'nominal' },
    },
  },
  concat_two: {
    data: { values },
    hconcat: [
      { mark: 'bar', encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
      { mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
    ],
  },
  scatter_log: {
    data: { values },
    mark: 'point',
    encoding: {
      x: { field: 'c', type: 'quantitative' },
      y: { field: 'b', type: 'quantitative', scale: { type: 'log' } },
    },
  },
  layered: {
    data: { values },
    layer: [
      { mark: 'line', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
      { mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
    ],
  },
};

// The showcase draws several charts on one printed page, so it uses the same
// specs at a size that fits. They are compiled the same way — a Vega-Lite spec
// with a width and a height is still a Vega-Lite spec — and kept apart from the
// parity specs so that shrinking a chart for the page cannot change what the
// comparison measures.
const SHOWCASE = {
  width: 170,
  height: 100,
  charts: ['bar', 'bar_stacked', 'line', 'area', 'scatter', 'histogram', 'pie'],
  // The showcase draws its charts on a transparent background, over a page that
  // is cream in one theme and near-black in the other. The default guide colour
  // is #000, which disappears against the dark one, so these specs ask for a
  // mid grey that reads on both. It is a property of the chart, not of the
  // theme — a chart carries its own colours — so it belongs in the spec.
  config: {
    axis: {
      labelColor: '#8a8f98',
      titleColor: '#8a8f98',
      domainColor: '#8a8f98',
      tickColor: '#8a8f98',
      gridColor: '#8a8f98',
      gridOpacity: 0.25,
    },
    // The plot frame is a style, not an axis.
    style: { cell: { stroke: '#8a8f98', strokeOpacity: 0.4 } },
  },
};

// The showcase's SECOND chart page, which exists to be varied rather than
// pretty: the chart types the first page does not show, and the features that
// only appear on some of them — a size legend whose rows are all different
// heights, a stroke legend, a log axis that labels only some of its ticks, two
// marks in one plot, and a text mark. Eight charts to a page rather than six,
// so each one is smaller.
// A third generated page: the chart types the runtime learned most recently,
// which are also the ones that exercise the most of it — a colour ramp with a
// gradient key, a series that is a faceted group, a stack centred on a common
// line, a calendar on an axis.
const MORE = {
  width: 150,
  height: 78,
  charts: ['heatmap', 'boxplot', 'line_coloured', 'streamgraph', 'line_temporal', 'donut', 'bar_normalized', 'bar_labelled'],
};

// A fourth generated page: the charts that are more than one chart. These are
// the ones whose SIZE is not the size of a plot — a trellis is as wide as its
// panels and the furniture around them, so the width and height below are per
// PANEL and the page has to hold whatever that adds up to. Four to a page
// rather than eight, because each one is a grid.

const PLOTS_CONFIG = {
  ...SHOWCASE.config,
  // A legend's own text, for the same reason the axis colours are stated: a
  // gradient key's title is drawn in black by default and vanishes on the dark
  // theme, and a key is not worth much without the word that says what it is
  // measuring.
  legend: { labelColor: '#8a8f98', titleColor: '#8a8f98' },
  // A text mark is the one data mark whose default colour is black, which
  // disappears on the dark theme the same way the guides would. Same reason,
  // same answer: the chart states a colour that reads on both.
  text: { color: '#8a8f98' },
};

const PLOTS = {
  width: 150,
  height: 78,
  charts: ['bar_grouped', 'area', 'bubble', 'scatter_colored', 'scatter_log', 'layered', 'text_labels', 'tick'],
  config: PLOTS_CONFIG,
};

// A fifth page: the variants a chart type has. Every one of these is the same
// mark as a chart already on the showcase, drawn a different way — which is
// the point, because it is the variants that break a runtime rather than the
// types.
const VARIANTS = {
  width: 150,
  height: 78,
  charts: ['bar_negative', 'bar_horizontal', 'bar_gantt', 'line_step', 'line_with_points', 'strip_plot', 'scatter_shapes', 'scatter_mean_rule'],
  config: PLOTS_CONFIG,
};

// And a sixth: the plots that are TABLES, where the cell is the datum and the
// two axes are both categories or both bins.
const TABLES = {
  width: 130,
  height: 70,
  charts: ['heatmap_binned', 'table_bubble', 'heatmap_labelled', 'radial'],
  config: PLOTS_CONFIG,
};

const VIEWS = {
  width: 78,
  height: 62,
  charts: ['facet_columns', 'facet_rows', 'facet_wrapped', 'concat_two'],
  config: {
    ...PLOTS_CONFIG,
    // The furniture only a multi-view chart has: the value each panel stands
    // for, and the field the panels are split by. They are drawn as GROUP
    // titles rather than as axis or legend text, so the axis colours above do
    // not reach them, and on the dark theme they would be near-black on
    // near-black.
    style: {
      ...PLOTS_CONFIG.style,
      'guide-label': { fill: '#8a8f98' },
      'guide-title': { fill: '#8a8f98' },
    },
  },
};

fs.mkdirSync(SPEC_DIR, { recursive: true });
const SHOWCASE_DIR = path.join(SPEC_DIR, 'showcase');
fs.mkdirSync(SHOWCASE_DIR, { recursive: true });
const PLOTS_DIR = path.join(SPEC_DIR, 'plots');
fs.mkdirSync(PLOTS_DIR, { recursive: true });
const MORE_DIR = path.join(SPEC_DIR, 'more');
fs.mkdirSync(MORE_DIR, { recursive: true });

for (const [name, spec] of Object.entries(SPECS)) {
  fs.writeFileSync(path.join(SPEC_DIR, `${name}.vl.json`), JSON.stringify(spec, null, 2) + '\n');
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(SPEC_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`${name}.vg.json`);
}

for (const name of SHOWCASE.charts) {
  const spec = { ...SPECS[name], width: SHOWCASE.width, height: SHOWCASE.height, config: SHOWCASE.config };
  // An arc chart is square: its radius is min(width, height) / 2.
  if (name === 'pie') { spec.width = 130; spec.height = 130; }
  // The page paints the background, so the chart does not.
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(SHOWCASE_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`showcase/${name}.vg.json`);
}

for (const name of PLOTS.charts) {
  const spec = { ...SPECS[name], width: PLOTS.width, height: PLOTS.height, config: PLOTS.config };
  // A tick chart's y axis is one band per category, so it needs room per row
  // rather than a fixed height; nine of them at 78px would overprint.
  if (name === 'tick') { spec.height = 108; }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(PLOTS_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`plots/${name}.vg.json`);
}

for (const name of MORE.charts) {
  const spec = { ...SPECS[name], width: MORE.width, height: MORE.height, config: PLOTS.config };
  // A heat map is a grid of cells, so it needs a row per category rather than
  // a fixed height, and a donut is square.
  if (name === 'donut') { spec.width = 110; spec.height = 110; }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(MORE_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`more/${name}.vg.json`);
}

const VARIANTS_DIR = path.join(SPEC_DIR, 'variants');
fs.mkdirSync(VARIANTS_DIR, { recursive: true });
for (const name of VARIANTS.charts) {
  const spec = { ...SPECS[name], width: VARIANTS.width, height: VARIANTS.height, config: VARIANTS.config };
  // A horizontal chart needs a row per category rather than a fixed height.
  if ((name === 'bar_horizontal') || (name === 'bar_gantt')) { spec.height = 108; }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(VARIANTS_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`variants/${name}.vg.json`);
}

const TABLES_DIR = path.join(SPEC_DIR, 'tables');
fs.mkdirSync(TABLES_DIR, { recursive: true });
for (const name of TABLES.charts) {
  const spec = { ...SPECS[name], width: TABLES.width, height: TABLES.height, config: TABLES.config };
  // A radial chart is square: its radius is min(width, height) / 2.
  if (name === 'radial') { spec.width = 110; spec.height = 110; }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(TABLES_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`tables/${name}.vg.json`);
}

const VIEWS_DIR = path.join(SPEC_DIR, 'views');
fs.mkdirSync(VIEWS_DIR, { recursive: true });
for (const name of VIEWS.charts) {
  const spec = { ...SPECS[name], width: VIEWS.width, height: VIEWS.height, config: VIEWS.config };
  // These are the only charts whose page size is not their plot size, and the
  // page is what constrains them: a printed column is about 250pt wide, so a
  // trellis has to be shaped to fit rather than sized to fit.
  //
  // A row facet stacks its panels, so each has to be short enough that the
  // column of them fits.
  if (name === 'facet_rows') { spec.height = 44; }
  // Nine panels two across is five rows and taller than the page. Three across
  // is three rows, which is also a better picture of what wrapping IS.
  if (name === 'facet_wrapped') { spec.columns = 3; spec.width = 40; spec.height = 32; }
  // A concatenation is as wide as its panes, and a band pane is as wide as its
  // BANDS — nine of them at the default step is wider than the page on its own.
  // So the left pane here counts two groups rather than nine categories.
  if (name === 'concat_two') {
    // A pane sizes itself: a concatenation has no width of its own to hand
    // down, so each pane says how big it is.
    spec.hconcat = [
      { width: 40, height: 62, mark: 'bar', encoding: { x: { field: 'g', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } } },
      { width: 84, height: 62, mark: 'point', encoding: { x: { field: 'c', type: 'quantitative' }, y: { field: 'b', type: 'quantitative' } } },
    ];
    delete spec.width;
    delete spec.height;
  }
  spec.background = null;
  const compiled = vl.compile(spec).spec;
  fs.writeFileSync(path.join(VIEWS_DIR, `${name}.vg.json`), JSON.stringify(compiled, null, 2) + '\n');
  console.log(`views/${name}.vg.json`);
}

console.log(`\n${Object.keys(SPECS).length} specs + ${SHOWCASE.charts.length} showcase + ${PLOTS.charts.length} plot specs written to ${path.relative(process.cwd(), SPEC_DIR)}`);
