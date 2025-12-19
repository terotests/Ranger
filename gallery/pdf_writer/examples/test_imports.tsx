// Test file with component imports
import { View, Label, Section, Page, Print } from "./evg_types";
import { Header } from "../components/Header";
import { ListItem } from "../components/ListItem";

const title = "Component Import Test";
const subtitle = "A Beautiful Demonstration";
const items = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig"];

function render() {
  return (
    <Print>
      <Page>
        <Section>
          <Header text={title} />

          <View padding={20} backgroundColor="#fafafa">
            <Label
              fontFamily="Cinzel"
              fontSize={22}
              fontWeight="bold"
              color="#2c3e50"
              marginBottom={6}
            >
              {subtitle}
            </Label>

            <Label
              fontFamily="Josefin Sans"
              fontSize={14}
              color="#7f8c8d"
              marginBottom={20}
            >
              Showcasing custom fonts and component composition
            </Label>

            <Label
              fontFamily="Open Sans"
              fontSize={16}
              fontWeight="bold"
              color="#34495e"
              marginBottom={12}
            >
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
