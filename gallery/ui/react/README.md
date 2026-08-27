# Dual-host React adapters

TypeScript side of `gallery/ui`. Same primitive names and props as the Ranger
`RgComponent` registry.

## Usage with real React (DOM)

```tsx
import { useState } from "react";
import { View, Text, Button } from "./primitives";

export function Counter() {
  const [n, setN] = useState(0);
  return (
    <View padding="20px" backgroundColor="#f8fafc">
      <Text fontSize="18px">count={n}</Text>
      <Button onClick={() => setN(n + 1)}>Inc</Button>
    </View>
  );
}
```

`View` → `div`, `Text` → `span`, `Button` → `button`, `Image` → `img`.
Style props (`padding`, `backgroundColor`, …) map to inline CSS camelCase
(same names EVG `setAttribute` accepts).

## Usage with Ranger → EVG

1. Compile the Ranger UI runtime (`npm run ui:test` builds the test bundle;
   a dedicated `ui:runtime` script can emit a module).
2. Point the component’s `createElement` / hooks import at that runtime
   instead of `react`.
3. Mount with `Renderer.renderToEVG` and paint through your EVG backend.

The component body stays the same; only the runtime import and the mount
target change.
