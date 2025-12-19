// Star component - renders a star with configurable properties
import { View, Label } from "./evg_types";

export function Star({
  color = "gold",
  size = 40,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Label fontSize={size} color={color}>
      ★
    </Label>
  );
}
