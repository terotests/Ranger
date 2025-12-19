// Product Catalog - Main render file demonstrating component imports
import { View, Label, Section, Page, Print } from "./evg_types";
import { ProductCard } from "./ProductCard";
import { Rating } from "./Rating";
import { Star } from "./Star";

// Sample product data
const products = [
  {
    name: "Wireless Mouse",
    price: 29.99,
    rating: 5,
    description: "Ergonomic wireless mouse with long battery life",
  },
  {
    name: "Mechanical Keyboard",
    price: 89.99,
    rating: 4,
    description: "RGB backlit mechanical keyboard with Cherry MX switches",
  },
  {
    name: "USB Hub",
    price: 19.99,
    rating: 3,
    description: "7-port USB 3.0 hub with individual power switches",
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
            marginBottom={8}
          >
            Product Catalog
          </Label>
          <Label fontSize={14} color="#666666" marginBottom={24}>
            Generated with TSX Components
          </Label>

          <View marginBottom={24}>
            <Label fontSize={12} color="#999999">
              Featured Rating:
            </Label>
            <Rating value={5} max={5} />
          </View>

          {products.map((product) => (
            <ProductCard
              name={product.name}
              price={product.price}
              rating={product.rating}
              description={product.description}
            />
          ))}

          <View
            marginTop={32}
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
