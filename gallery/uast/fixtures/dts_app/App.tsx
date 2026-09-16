import { useCallback, useEffect, useState } from 'react';
import { GameView } from './GameView';
import { StoryList } from './StoryList';
import type { GameConfig, StorySummary } from './types';
import { loadStories } from './db';

export default function App() {
  const [config, setConfig] = useState<GameConfig>({ storySource: 'static' });
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setConfig({ storySource: id });
  }, []);

  useEffect(() => {
    loadStories();
  }, []);

  return (
    <div>
      <StoryList stories={stories} onSelect={handleSelect} />
      <GameView config={config} />
    </div>
  );
}
