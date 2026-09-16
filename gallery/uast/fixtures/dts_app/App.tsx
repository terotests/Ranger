// Shaped after terotests/koodisampo web/src/App.tsx — used to project as
// an empty «component» App with only render().
import { useCallback, useEffect, useState } from 'react';
import { GameView } from './components/GameView';
import { StoryList } from './components/StoryList';
import { useAppNavigation, loadStoryIndex } from './hooks/useAppNavigation';
import { getAllPlayerFeatures, getAllProgress, getPlayerStats } from './db/indexedDb';
import type { GameConfig, StoryProgress, StorySummary } from './types/story';
import type { PlayerFeature } from './types/features';

export default function App() {
  const [config, setConfig] = useState<GameConfig>({ storySource: 'static' });
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, StoryProgress>>(new Map());
  const [playerFeatures, setPlayerFeatures] = useState<PlayerFeature[]>([]);
  const [stats, setStats] = useState<{
    totalKarma: number;
    storiesCompleted: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    const all = await getAllProgress();
    setProgressMap(new Map());
    const features = await getAllPlayerFeatures();
    setPlayerFeatures(features);
    const s = await getPlayerStats();
    setStats({
      totalKarma: s.totalKarma,
      storiesCompleted: s.storiesCompleted,
    });
  }, []);

  const loadIndex = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const index = await loadStoryIndex(config);
      setStories(index);
      await refreshProgress();
    } catch (e) {
      setError('Lataus epäonnistui');
    } finally {
      setLoading(false);
    }
  }, [config, refreshProgress]);

  const nav = useAppNavigation({
    config,
    onListReady: () => void refreshProgress(),
  });

  useEffect(() => {
    void loadIndex();
  }, [loadIndex]);

  const exitGame = () => {
    nav.goToList('push');
  };

  const toggleSource = () => {
    setConfig({ storySource: 'server' });
  };

  if (nav.activeStory) {
    return (
      <GameView
        story={nav.activeStory}
        onHistoryPush={(nodeId) => nav.pushGameStep(nodeId)}
        onExit={exitGame}
        onFeaturesChanged={() => void refreshProgress()}
      />
    );
  }

  return (
    <div className="app">
      <StoryList
        stories={stories}
        progressMap={progressMap}
        playerFeatures={playerFeatures}
        onSelect={(id) => void nav.startStory(id)}
        onToggleSource={toggleSource}
        stats={stats}
      />
    </div>
  );
}
