// Taso 3 — linnoitus, kaksi tunnelia ja tiukemmat käytävät.
// `*` = hedelmä (pisteitä + lyhyt haamujen pelko).
import { setLevelConfig } from "./pacman_shared";

export function installFortressLevel() {
  setLevelConfig({
    id: "fortress",
    label: "LEVEL 3",
    nextLevel: "",
    tile: 14,
    pace: 1.7,
    maze: [
      "#############################",
      "#O.....#.............#.....O#",
      "#.####.#.###########.#.####.#",
      ".......#...*..#..*...#.......",
      "######.####.#.#.#.####.######",
      "#..........#.#.#.#..........#",
      "#.########.#.#S#.#.########.#",
      "#....#........*........#....#",
      "####.#.###.#####.###.#.####.#",
      ".....#.#.....*.......#.#.....",
      "######.#.###########.#.######",
      "#O....*.................*..O#",
      "#.####.#####.#.#####.####.#.#",
      "#......*......#......*......#",
      "#############################"
    ],
    tunnelRows: [3, 9],
    ghostStarts: [
      { col: 1, row: 5 },
      { col: 27, row: 5 },
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
