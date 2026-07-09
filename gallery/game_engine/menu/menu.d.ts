/** One entry injected by the SDL host from game_catalog.rgr scan. */
interface GameCatalogEntry {
  id: string;
  title: string;
  path: string;
  icon?: string;
}

/** Populated by game_sdl_runner before loading this menu script. */
declare const gameCatalog: GameCatalogEntry[];
