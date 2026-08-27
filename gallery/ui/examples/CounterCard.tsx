/**
 * Example component written against the dual-host surface.
 * Under real React: import from ../react/primitives.
 * Under Ranger→EVG: compile gallery/ui and use createElement from that runtime.
 */

import { useState, View, Text, Button } from "../react/primitives";

export function CounterCard() {
  const [n, setN] = useState(0);
  return (
    <View
      width="320px"
      padding="24px"
      backgroundColor="#ffffff"
      borderRadius="12px"
      flexDirection="column"
      gap="12px"
    >
      <Text fontSize="20px" fontWeight="bold" color="#0f172a">
        Ranger UI
      </Text>
      <Text fontSize="14px" color="#475569">
        Same component shape for React DOM or EVG.
      </Text>
      <Text fontSize="18px" color="#111111">
        count={n}
      </Text>
      <Button onClick={() => setN(n + 1)}>Increment</Button>
    </View>
  );
}
