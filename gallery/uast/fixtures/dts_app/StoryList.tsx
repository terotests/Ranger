import type { StorySummary } from './types'

export function StoryList(props: { stories: StorySummary[] }) {
  const handleClick = () => {
    return props.stories
  }
  return <button onClick={handleClick} />
}
