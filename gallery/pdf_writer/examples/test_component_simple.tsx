// Simple test file - no imports, just basic component
import { View, Label, Section, Page, Print } from "./evg_types";

const title = "Hello Component Engine!";
const items = ["First", "Second", "Third"];

function Header({ text }: { text: string }) {
  return (
    <View padding={20} backgroundColor="#3b82f6">
      <Label fontSize={24} fontWeight="bold" color="#ffffff">
        {text}
      </Label>
    </View>
  );
}

function ListItem({ label, index }: { label: string; index: number }) {
  return (
    <View
      padding={8}
      marginBottom={4}
      backgroundColor={index % 2 === 0 ? "#f5f5f5" : "#ffffff"}
    >
      <Label fontSize={14} color="#333333">
        {index + 1}. {label}
      </Label>
    </View>
  );
}

function render() {
  return (
    <Print>
      <Page>
        <Section>
          <Header text={title} />

          <View padding={16}>
            <Label fontSize={16} fontWeight="bold" marginBottom={8}>
              Item List:
            </Label>

            {items.map((item, i) => (
              <ListItem label={item} index={i} />
            ))}
          </View>
        </Section>
      </Page>
    </Print>
  );
}
