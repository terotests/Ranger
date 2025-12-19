// Header component
import { View, Label } from "../evg_types";

export function Header({
  text,
  backgroundColor = "#3b82f6",
}: {
  text: string;
  backgroundColor?: string;
}) {
  return (
    <View padding={20} backgroundColor={backgroundColor}>
      <Label fontSize={24} fontWeight="bold" color="#ffffff">
        {text}
      </Label>
    </View>
  );
}
