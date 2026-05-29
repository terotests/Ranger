import { CounterBoard } from "./components/CounterBoard";
import { ProcessTreePanel } from "./components/ProcessTreePanel";

export function App() {
  return (
    <div className="app">
      <main>
        <CounterBoard />
      </main>
      <ProcessTreePanel />
    </div>
  );
}
