// Taso 2 — puutarha-labyrintti, tiheämmät käytävät.
// `*` = hedelmä (pisteitä + lyhyt haamujen pelko).
import { setLevelConfig } from "./pacman_shared";

export function installGardenLevel() {
  setLevelConfig({
    id: "garden",
    label: "LEVEL 2",
    nextLevel: "level3.tsx",
    tile: 14,
    pace: 1.85,
    maze: [
      "#############################",
      "#O...#........#........#...O#",
      "#.###.#.####.###.####.#.###.#",
      "#...*.........*.........*...#",
      "###.#.#####.#.#.#####.#.###.#",
      "#...#.......#S#.......#...#.#",
      "#.#####.###.#.#.###.#####.#.#",
      "......#.#...........#.#......",
      "#.#####.#.###.#.###.#.#####.#",
      "#...*...#...#.#.#...#...*...#",
      "#.###.#####.#.#.#.#####.###.#",
      "#O..........*..........*...O#",
      "#.###.#.###########.#.###.#.#",
      "#.....#......*......#.....#.#",
      "#############################"
    ],
    tunnelRows: [7],
    ghostStarts: [
      { col: 3, row: 3 },
      { col: 25, row: 3 },
      { col: 3, row: 11 },
      { col: 25, row: 11 }
    ],
    scatterTargets: [
      { col: 1, row: 1 },
      { col: 27, row: 1 },
      { col: 1, row: 13 },
      { col: 27, row: 13 }
    ]
  });
}
