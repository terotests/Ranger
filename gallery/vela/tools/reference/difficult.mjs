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
    + 'is not there, which is what trellis_area_seattle relies on'
};

/** The names, in the order they were won. */
export const DIFFICULT_NAMES = Object.keys(DIFFICULT);

export function isDifficult(name) {
  return Object.hasOwn(DIFFICULT, name);
}
