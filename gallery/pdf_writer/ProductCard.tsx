// Product Card component - reusable card for product display
import { View, Label } from "./evg_types";
import { Rating } from "./Rating";

export function ProductCard({
  name,
  price,
  rating = 4,
  description = "",
}: {
  name: string;
  price: number;
  rating?: number;
  description?: string;
}) {
  return (
    <View
      padding={16}
      marginBottom={16}
      borderWidth={1}
      borderColor="#dddddd"
      borderRadius={8}
      backgroundColor="#fafafa"
    >
      <Label fontSize={18} fontWeight="bold" color="#333333">
        {name}
      </Label>
      <Label fontSize={14} color="#666666" marginTop={4}>
        {description}
      </Label>
      <View flexDirection="row" marginTop={8}>
        <Label fontSize={20} fontWeight="bold" color="#2e7d32">
          ${price}
        </Label>
      </View>
      <View marginTop={8}>
        <Rating value={rating} max={5} />
      </View>
    </View>
  );
}
