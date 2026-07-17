// Taso 1 — leveä avenue-labyrintti (helppo lukea kaksinpelin split-screenissä).
import { setLevelConfig } from "./pacman_shared";

export function installAvenueLevel() {
  setLevelConfig({
    id: "avenue",
    label: "LEVEL 1",
    nextLevel: "level2.tsx",
    tile: 14,
    pace: 2.0,
    maze: [
      "#############################",
      "#O............#............O#",
      "#.####.######.#.######.####.#",
      "#...........................#",
      "#.####.#.###########.#.####.#",
      "#......#......S......#......#",
      "######.######.#.######.######",
      ".......#......#......#.......",
      "######.#.####.#.####.#.######",
      "#......#.............#......#",
      "#.####.#.###########.#.####.#",
      "#O.........................O#",
      "#.####.######.#.######.####.#",
      "#.............#.............#",
      "#############################"
    ],
    tunnelRows: [7],
    ghostStarts: [
      { col: 1, row: 3 },
      { col: 27, row: 3 },
      { col: 1, row: 9 },
      { col: 27, row: 9 }
    ],
    scatterTargets: [
      { col: 1, row: 1 },
      { col: 27, row: 1 },
      { col: 1, row: 13 },
      { col: 27, row: 13 }
    ]
  });
}
