// Complete Catalog Test - All components in one file
import { View, Label, Section, Page, Print } from "./evg_types";

// Star component
function Star({ filled }: { filled: boolean }) {
  return (
    <View width={20} height={20}>
      <Label fontSize={16} color={filled ? "#ffc107" : "#e0e0e0"}>
        ★
      </Label>
    </View>
  );
}

// Rating component using Star
function Rating({ value, max }: { value: number; max: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View flexDirection="row" alignItems="center">
      {stars.map((i) => (
        <Star filled={i <= value} />
      ))}
    </View>
  );
}

// ProductCard component
function ProductCard({
  name,
  price,
  rating,
  description,
}: {
  name: string;
  price: number;
  rating: number;
  description: string;
}) {
  return (
    <View
      padding={16}
      marginBottom={16}
      backgroundColor="#ffffff"
      borderWidth={1}
      borderColor="#e0e0e0"
      borderRadius={8}
    >
      <View flexDirection="row" justifyContent="space-between" marginBottom={8}>
        <Label fontSize={18} fontWeight="bold" color="#212121">
          {name}
        </Label>
        <Label fontSize={18} fontWeight="bold" color="#4caf50">
          ${price}
        </Label>
      </View>
      <Label fontSize={14} color="#757575" marginBottom={8}>
        {description}
      </Label>
      <Rating value={rating} max={5} />
    </View>
  );
}

// Sample data
const products = [
  {
    name: "Wireless Mouse",
    price: 29.99,
    rating: 5,
    description: "Ergonomic wireless mouse",
  },
  {
    name: "Mechanical Keyboard",
    price: 89.99,
    rating: 4,
    description: "RGB backlit keyboard",
  },
  {
    name: "USB Hub",
    price: 19.99,
    rating: 3,
    description: "7-port USB 3.0 hub",
  },
];

function render() {
  return (
    <Print>
      <Page>
        <Section padding={40}>
          <Label
            fontSize={28}
            fontWeight="bold"
            color="#1a237e"
            marginBottom={16}
          >
            Product Catalog
          </Label>

          {products.map((product) => (
            <ProductCard
              name={product.name}
              price={product.price}
              rating={product.rating}
              description={product.description}
            />
          ))}

          <View
            marginTop={24}
            padding={16}
            backgroundColor="#e3f2fd"
            borderRadius={4}
          >
            <Label fontSize={14} color="#1565c0" textAlign="center">
              Thank you for viewing our catalog!
            </Label>
          </View>
        </Section>
      </Page>
    </Print>
  );
}
