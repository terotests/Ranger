import type { GameConfig, StorySummary } from '../types/story'

export function useAppNavigation(opts: { config: GameConfig }) {
  return {
    navError: null,
    activeStory: null,
    storyLoading: false,
    goToList: (mode: string) => {
      return mode
    },
    startStory: (id: string) => {
      return id
    },
    pushGameStep: (nodeId: string) => {
      return nodeId
    },
  }
}

export function loadStoryIndex(config: GameConfig): StorySummary[] {
  return []
}
