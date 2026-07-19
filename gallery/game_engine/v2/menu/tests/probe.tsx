// launcher test fixture (guest-side, games/AGENTS.md rule 5) — NOT shipped logic.
function selectedIndex(slot) { return __menu.selected; }
function currentPage(slot) { return __menu.page; }
function tileCount(slot) { return __menu.tileSprites.length; }
function selectedLabelIsPomppija(slot) {
  if (__menu.page != 1) { return 0; }
  if (CATALOG[__menu.categoryIndex].entries[__menu.selected].label == "Pomppija") { return 1; }
  return 0;
}
