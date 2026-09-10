// SPDX-License-Identifier: AGPL-3.0-or-later
//
// THE CHART COMPILER, IN ITS OWN FILE.
//
// This module exists to be imported LATE. Nothing on the path to the first
// frame names `RtVelaChartMaker`, so the bundler puts it — and Vela's
// compiler, runtime, scales, axes and legends behind it, 440 KB of the app's
// 2.49 MB — in a chunk of its own. The host asks for that chunk once a frame
// is on the screen, and the statistics cards draw their curves from the next
// rebuild on.
//
// Until then `RtCharts` answers with the base maker, which draws no commands:
// the cards are there, with their numbers, without their sparklines. That is
// the honest intermediate state and it lasts about as long as one request.
import { RtCharts } from "./generated-host.js";
// Straight at the deferred module, not through `generated-host.js`: a name
// re-exported from there is a name the page's entry imports, and an entry
// that imports it downloads it. See build.mjs.
import { RtVelaChartMaker } from "../bin/RealTrainerDemo.charts.mjs";

RtCharts.install(new RtVelaChartMaker());

/** How many makers have been installed — the host's proof this ran. */
export const installs = RtCharts.installCount();
