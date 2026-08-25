// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Snippets the docs run in the page. They are the published API, in the
 * shape the playground already executes: `Pptx` and `Chart` are in scope,
 * and the last line returns a deck.
 */

export const createTitleSlide = `const deck = Pptx.create();
const slide = deck.addSlide().background("FFFFFF");

slide.addTextBox(70, 150, 820, 110, "Quarterly review")
     .setName("Title")
     .run(0, 0).font("Calibri", 44).bold().color("#1F3864");

slide.addTextBox(70, 265, 820, 60, "Sales, by region")
     .run(0, 0).font("Calibri", 22).color("#5B6B84");

slide.addShape("rect", 70, 340, 300, 8).fill("4472C4").noLine();
return deck;`;

export const severalSlides = `const deck = Pptx.create();

["Problem", "Approach", "Result"].forEach((word, i) => {
  const slide = deck.addSlide().background("FFFFFF");
  slide.addTextBox(80, 90, 800, 90, word)
       .run(0, 0).font("Calibri", 40).bold().color("#1F3864");
  slide.addShape("rect", 80, 200, 60 + i * 260, 26).fill("4472C4").noLine();
  slide.addTextBox(80, 250, 800, 60, "Slide " + (i + 1) + " of 3")
       .run(0, 0).font("Calibri", 18).color("#7A8AA0");
});
return deck;`;

export const vegaChart = `const deck = Pptx.create();
const slide = deck.addSlide().background("FFFFFF");

slide.addTextBox(70, 40, 820, 50, "Revenue by quarter")
     .run(0, 0).font("Calibri", 30).bold().color("#1F3864");

const chart = Chart().font("Calibri");
chart.addTo(slide, {
  width: 460, height: 260,
  data: { values: [
    { quarter: "Q1", revenue: 28 },
    { quarter: "Q2", revenue: 55 },
    { quarter: "Q3", revenue: 43 },
    { quarter: "Q4", revenue: 91 },
  ]},
  mark: { type: "bar", color: "#4472C4" },
  encoding: {
    x: { field: "quarter", type: "nominal", title: null },
    y: { field: "revenue", type: "quantitative", title: "M€" },
  },
}, 70, 110, 620, 380);

slide.addTextBox(70, 500, 820, 40, chart.shapeCount + " shapes — not one pixel of image")
     .run(0, 0).font("Calibri", 16).color("#5B6B84");
return deck;`;
