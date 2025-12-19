// Rating component - renders stars for rating
import { View, Label } from "./evg_types";
import { Star } from "./Star";

export function Rating({
  value = 3,
  max = 5,
}: {
  value?: number;
  max?: number;
}) {
  const stars = [];
  for (let i = 0; i < max; i++) {
    stars.push(i);
  }

  return (
    <View flexDirection="row" gap={4}>
      {stars.map((i) => (
        <Star key={i} color={i < value ? "gold" : "gray"} size={20} />
      ))}
    </View>
  );
}
