import type { StorySummary } from '../types/story'

export function StoryList(props: { stories: StorySummary[] }) {
  const handleClick = () => {
    return props.stories
  }
  return <button onClick={handleClick} />
}
