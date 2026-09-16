import type { GameConfig } from '../types/story'

export function GameView(props: { story: string }) {
  return <div>{props.story}</div>
}
