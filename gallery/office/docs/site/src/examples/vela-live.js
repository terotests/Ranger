// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Snippets the Chart API docs run in the page. `chart` is a compiled
 * `VlChart`. The last line is not a return: the page reads the object
 * after the calls, the way /evg/chart-api/ does.
 */

export const chartData = JSON.stringify([
  { region: "North", quarter: "2016-01-01", sales: 120, cost: 82 },
  { region: "North", quarter: "2016-04-01", sales: 145, cost: 91 },
  { region: "North", quarter: "2016-07-01", sales: 132, cost: 88 },
  { region: "North", quarter: "2016-10-01", sales: 168, cost: 99 },
  { region: "South", quarter: "2016-01-01", sales: 93, cost: 71 },
  { region: "South", quarter: "2016-04-01", sales: 88, cost: 66 },
  { region: "South", quarter: "2016-07-01", sales: 104, cost: 74 },
  { region: "South", quarter: "2016-10-01", sales: 121, cost: 80 },
], null, 1);

export const chartBar = `chart.size(320, 200);
chart.heading("Sales by region");
const bars = chart.bar();
bars.x("region").keepOrder();
bars.y("sales").aggregate("sum").title("sales");`;

export const chartLayer = `chart.size(320, 190);
chart.x("quarter").y("sales").color("region");
chart.area().markOpacity(0.35);
chart.line();`;
