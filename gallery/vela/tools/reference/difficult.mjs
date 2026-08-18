// =============================================================================
// difficult.mjs — the gallery charts whose exactness was hard-won
// =============================================================================
// Most of what the coverage report converts, it converts in a handful of lines:
// a guide default read from the wrong place, a channel nobody wrote. The charts
// below were not like that. Each one held out until something the reference
// does had to be reproduced exactly — a rounding order, a float crumb, a whole
// layout rule — and several of them moved only after a wrong hypothesis had
// been measured and reverted first.
//
// They are listed for two reasons.
//
// The first is a regression watch. A chart that took a day to make exact can be
// made inexact again by one line somewhere else, and it will come back as a
// single `DIFF` among fifty in a report that exits 0 whatever it finds. The
// coverage report says so loudly instead: if one of these is no longer drawn
// exactly, that is the news, whatever else the run found.
//
// The second is that a difficult chart is a good place to start reading. The
// note against each one names what it actually took, which is the shortest
// route into that part of the layout: the commit that says the same thing at
// length is the one to read next.
//
// A chart belongs here because it was hard, not because it is important. The
// list does not gate anything and does not need to stay in step with any other
// count — nothing goes wrong if it is never added to again.
// =============================================================================

export const DIFFICULT = {
  trellis_scatter:
    'a grid rounds each END of a panel outward on its own and takes the widest '
    + 'of each end across the whole trellis — not the widest panel',

  circle_natural_disasters:
    'a guide\'s items are keyed by their value, and a date written as a key is '
    + 'written only to the second: two ticks inside one second are one tick',

  isotype_bar_chart_emoji:
    'a turned title is worth its measured box, not its font size — a quarter '
    + 'turn has no exact cosine in binary, and the page is sized by the ceiling',

  interactive_overview_detail:
    'how far a vertical axis\' end labels hang past the plot is MEASURED; '
    + 'assuming half a line spaced two concatenated plots four pixels apart',

  interactive_layered_crossfilter:
    'a repeated grid lines its copies up on one pitch, the way a trellis does, '
    + 'rather than taking a concatenation\'s per-pane spacing',

  bar_grouped_repeated:
    'a discrete scale unions the categories its layers each name, a sub-scale '
    + 'given as a datum is written as a value, and a band step does not survive '
    + 'the round trip out to the plot width and back',

  bar_size_responsive:
    '"width": "container" is autosize FIT: the drawing fits the width given '
    + 'rather than the plot keeping it, which takes measure, resize, measure',

  layer_likert:
    'a band\'s padding follows the mark, a scale\'s domain reads its own '
    + 'layer\'s rows, a mark may state its position in pixels, and a view block '
    + 'may sit on the chart rather than in its configuration',

  bar_layered_weather:
    'a dotted field name is a path into the row, a bar\'s end room goes ACROSS '
    + 'the bar, a stated domain suppresses zero, and a label may be written on '
    + 'several lines',

  trellis_area_seattle:
    'a facet states how its strips are labelled AND what order they come in: '
    + 'the label\'s angle decides the shape of the strip, the order is an '
    + 'aggregate the partition carries under a name of its own, and an area '
    + 'whose scale misses zero stands on the near end of its domain instead',

  layer_candlestick:
    'a bar on a continuous axis is given a band — five pixels, centred — and '
    + 'the scale five pixels of room at each end; a label turned forty-five '
    + 'degrees is worth a rotated box; and a padded time domain is truncated '
    + 'to whole milliseconds, which is worth a pixel on two gridlines',

  concat_marginal_histograms:
    'a concatenation inside a concatenation numbers its panes from one again, '
    + 'so two panes were called data_1 and one drew the other\'s rows; the '
    + 'inner row names its own shared height; a group\'s rectangle reaches as '
    + 'far as its panes do and not a margin further; and which end of a bin is '
    + 'nudged which way follows the direction the scale runs',

  brush_table:
    'a key belongs to the page unless the chart resolves it independently, and '
    + 'then it belongs to the pane whose scale it names — which means a pane '
    + 'has to be able to carry one and to reserve the room beside it',

  trellis_barley:
    'a trellis ordered by a SUMMARY of a column has to compute the ranking '
    + 'before its own aggregate summarises that column away — one value per '
    + 'panel, written onto every row and carried through by being grouped on. '
    + 'A sort that names a column and no op is the other case entirely: the '
    + 'reference looks for it in the derived rows and orders nothing when it '
    + 'is not there, which is what trellis_area_seattle relies on',

  parallel_coordinate:
    'a line is one shape per SERIES and a chart may tell its series apart by '
    + 'more than one thing at once, so the partition is a list and not a '
    + 'column: coloured by species alone, three hundred birds came out as '
    + 'three lines. Its guides are marks rather than axes, which needs three '
    + 'more things read where the chart actually says them — a per-side axis '
    + 'block at COMPILE time, a named style resolved for a mark that carries '
    + 'one, and a tick centred on the axis it is thin in rather than placed '
    + 'by an edge it has no depth along',

  interactive_splom:
    'a brush that each PANE answers for is drawn whether anything is in it '
    + 'or not, and on a pane it brushes in one direction only the other '
    + 'direction is the whole pane — three rectangles three hundred pixels '
    + 'tall and none wide, down the diagonal, where a variable is plotted '
    + 'against itself and is therefore brushed once and not twice',

  rect_mosaic_labelled_with_offset:
    'four things at once, none of them about mosaics: an opacity read from a '
    + 'column, a POSITION scale shared across a concatenation because the '
    + 'chart said so, a pane gap stated once in the configuration, and an '
    + 'axis title merge that compared a channel name against a scale name — '
    + 'the same string in a plain chart and not in a pane',

  layer_point_line_regression:
    'a fitted line is a running mean accumulated one row at a time, not a sum '
    + 'divided at the end: the two are different numbers in floating point and '
    + 'an R-squared printed to two places lands either side of a rounding. The '
    + 'line itself is sampled at twenty-five even steps across the range of x, '
    + 'which is where the reference stops refining a curve that is straight',

  geo_circle:
    'a projection is a page of constants and a convention about the order the '
    + 'rotation, the centring and the scaling are applied in — and albersUsa '
    + 'is not one projection but three, each with a rectangle, so that Alaska '
    + 'and Hawaii sit in the corner of a map of the mainland. Only the '
    + 'constants can be read off a formula; the convention had to be measured '
    + 'against d3 point by point, which is what tools/reference/geo.mjs does',

  point_angle_windvector:
    'four thousand eight hundred wedges on an equal-area projection, each '
    + 'turned by the wind it stands for. Three separate things had to be true '
    + 'at once: a turned symbol is MEASURED turned, or the page reserves the '
    + 'wrong room round it; a key is spaced by the ink of the shape it draws '
    + 'and not by a circle of the same area, because a wedge points; and a '
    + 'sequential colour scale multiplies by one over the span where a '
    + 'position scale divides by it — one bit apart, and thirteen of three '
    + 'hundred and sixty-one wind directions round the other way',

  concat_bar_scales_discretize:
    'three scales that answer in BANDS rather than continuously, and every '
    + 'number about them read off vega rather than guessed at: how many bands '
    + 'a scheme means when nothing says (five, except four for a size), where '
    + 'a quantile cuts, and that a key for a banded scale is one row per band '
    + 'labelled by the cuts. Two channels reading one column are also one key '
    + 'and not two — folded by TITLE they stayed apart, because a chart that '
    + 'titles its colours and leaves its sizes to the column name does not '
    + 'call them the same thing',

  facet_bullet:
    'a trellis may resolve a scale INDEPENDENTLY, and then the scale is not '
    + 'the only thing that moves into the panel: the rows it measures go with '
    + 'it — re-derived from that panel\'s partition — and so does the axis '
    + 'that labels it, so there is no strip of axes under the trellis at all. '
    + 'A bar with nothing on the other axis is the other half: it has no band '
    + 'to sit in, so it crosses the whole panel, centred, as thick as the '
    + 'panel unless the mark says otherwise'
};

/** The names, in the order they were won. */
export const DIFFICULT_NAMES = Object.keys(DIFFICULT);

export function isDifficult(name) {
  return Object.hasOwn(DIFFICULT, name);
}
