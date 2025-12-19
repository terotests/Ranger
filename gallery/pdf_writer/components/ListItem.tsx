// ListItem component
import { View, Label } from "../evg_types";

export function ListItem({ label, index }: { label: string; index: number }) {
  return (
    <View
      padding={8}
      marginBottom={4}
      backgroundColor={index % 2 === 0 ? "#f0f0f0" : "#ffffff"}
    >
      <Label fontSize={14} color="#333333">
        {index + 1}. {label}
      </Label>
    </View>
  );
}
