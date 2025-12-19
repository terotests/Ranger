import { Print, Section, Page, View, Label } from "./evg_types";

// Higher-order component that wraps content in a card
function Card({ title, children }) {
  return (
    <View backgroundColor="#ecf0f1" padding="20px" borderRadius="10px" marginBottom="20px">
      <Label fontSize="18px" fontWeight="bold" color="#2c3e50" marginBottom="15px">
        {title}
      </Label>
      {children}
    </View>
  );
}

// Component that accepts an icon prop as JSX
function IconButton({ icon, label }) {
  return (
    <View flexDirection="row" backgroundColor="#3498db" padding="10px" borderRadius="5px" marginBottom="10px">
      {icon}
      <Label fontSize="12px" color="#ffffff" marginLeft="10px">
        {label}
      </Label>
    </View>
  );
}

// Simple icon components
function StarIcon({ color = "#FFD700" }) {
  return (
    <View width="20px" height="20px">
      <Path 
        d="M10,2 L12,8 L18,8 L13,12 L15,18 L10,14 L5,18 L7,12 L2,8 L8,8 Z"
        width="20px"
        height="20px"
        fill={color}
      />
    </View>
  );
}

function HeartIcon({ color = "#e74c3c" }) {
  return (
    <View width="20px" height="20px">
      <Path 
        d="M10,18 L4,12 C2,10 2,6 4,4 C6,2 10,4 10,4 C10,4 14,2 16,4 C18,6 18,10 16,12 Z"
        width="20px"
        height="20px"
        fill={color}
      />
    </View>
  );
}

// Container component that accepts header and footer as props
function PageLayout({ header, footer, children }) {
  return (
    <View width="100%" height="100%">
      <View backgroundColor="#34495e" padding="15px">
        {header}
      </View>
      <View flex="1" padding="20px" backgroundColor="#ffffff">
        {children}
      </View>
      <View backgroundColor="#2c3e50" padding="10px">
        {footer}
      </View>
    </View>
  );
}

function render() {
  return (
    <Print title="Higher-Order Components Test" author="EVG Demo">
      <Section pageWidth="595" pageHeight="842" margin="40px">
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label fontSize="28px" fontWeight="bold" color="#2c3e50" marginBottom="25px">
              Higher-Order Components Test
            </Label>

            {/* Test 1: Card component with children */}
            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="10px">
              Test 1: Card with Children
            </Label>
            <Card title="Welcome Card">
              <Label fontSize="14px" color="#7f8c8d">
                This content is passed as children to the Card component.
              </Label>
              <Label fontSize="12px" color="#95a5a6" marginTop="10px">
                Multiple child elements are supported.
              </Label>
            </Card>

            {/* Test 2: Icon passed as prop */}
            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="10px">
              Test 2: JSX Element as Prop
            </Label>
            <IconButton icon={<StarIcon color="#FFD700" />} label="Star Button" />
            <IconButton icon={<HeartIcon color="#ffffff" />} label="Heart Button" />

            {/* Test 3: Nested Card */}
            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="10px">
              Test 3: Nested Components
            </Label>
            <Card title="Outer Card">
              <Card title="Inner Card">
                <Label fontSize="12px" color="#7f8c8d">
                  Deeply nested content works too!
                </Label>
              </Card>
            </Card>
          </View>
        </Page>

        <Page>
          <PageLayout
            header={<Label fontSize="18px" color="#ffffff">Page Header</Label>}
            footer={<Label fontSize="10px" color="#bdc3c7">© 2025 EVG Demo</Label>}
          >
            <Label fontSize="16px" fontWeight="bold" color="#2c3e50" marginBottom="15px">
              Page with Header and Footer Props
            </Label>
            <Label fontSize="14px" color="#7f8c8d">
              This demonstrates passing JSX elements as header and footer props to a layout component.
            </Label>
            <Label fontSize="14px" color="#7f8c8d" marginTop="10px">
              The header and footer are rendered in their designated slots.
            </Label>
          </PageLayout>
        </Page>
      </Section>
    </Print>
  );
}

export default render;
