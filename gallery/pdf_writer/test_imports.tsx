// Test file with component imports
import { View, Label, Section, Page, Print } from "./evg_types";
import { Header } from "./components/Header";
import { ListItem } from "./components/ListItem";

const title = "Component Import Test";
const items = ["Apple", "Banana", "Cherry", "Date"];

function render() {
  return (
    <Print>
      <Page>
        <Section>
          <Header text={title} />

          <View padding={16}>
            <Label fontSize={16} fontWeight="bold" marginBottom={8}>
              Fruit List:
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
