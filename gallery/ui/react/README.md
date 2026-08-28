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

```bash
npm run ui:module
```

```js
const {
  createElement, useState, View, Text, Button, renderToDisplayListJson,
} = require("../runtime/ranger-ui-runtime.cjs");

function CounterCard() {
  // Same createElement shape as JSX → React.createElement
  return createElement(View, { padding: "24px", backgroundColor: "#fff" },
    createElement(Text, { fontSize: "18px" }, "count=0"),
    createElement(Button, null, "Increment"));
}

const json = renderToDisplayListJson(CounterCard(), 360, 280);
// json.list.cmds → gallery/evg/gl/evg-webgl.js or SDL EvgGlPainter
```

Mount with `Renderer` / `RangerUI` in Ranger, or the Node façade above. The
display-list JSON is the same wire format `demo.html` already paints.
