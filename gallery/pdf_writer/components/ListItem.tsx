// ListItem component
import { View, Label, Image } from "../evg_types";

export function ListItem({ label, index }: { label: string; index: number }) {
  return (
    <View
      padding={12}
      marginBottom={6}
      backgroundColor={index % 2 === 0 ? "#ecf0f1" : "#ffffff"}
      flexDirection="row"
      alignItems="center"
    >
      <Label 
        fontFamily="Open Sans"
        fontSize={15} 
        color="#2c3e50" 
        width="80%"
      >
        {index + 1}. {label}
      </Label>
      <Image src="Canon_40D.jpg" width={20} height={20} />
    </View>
  );
}
