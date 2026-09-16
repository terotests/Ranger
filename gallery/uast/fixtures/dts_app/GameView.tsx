import type { GameConfig } from './types'

export function GameView(props: { config: GameConfig }) {
  return <div>{props.config.storySource}</div>
}
