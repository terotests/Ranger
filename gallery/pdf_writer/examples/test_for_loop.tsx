// Test file for for loop evaluation with EVG elements
// Tests: for loop, array.push, UpdateExpression (i++), compound assignment (+=)
import { View, Label, Section, Page, Print } from "./evg_types";

// Test data
const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];
const itemCount = 6;

// Component that builds items using a for loop
function ColorBox({ color, index }: { color: string; index: number }) {
  return (
    <View 
      padding={12} 
      marginBottom={4} 
      backgroundColor={color}
      borderRadius={4}
    >
      <Label fontSize={14} fontWeight="bold" color="#ffffff">
        Box {index + 1}: {color}
      </Label>
    </View>
  );
}

// Function that uses for loop to create elements
function buildColorBoxes() {
  const boxes: any[] = [];
  
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    boxes.push(<ColorBox color={color} index={i} />);
  }
  
  return boxes;
}

// Function that uses for loop with i += 2 (skip every other)
function buildAlternateBoxes() {
  const boxes: any[] = [];
  
  for (let i = 0; i < colors.length; i += 2) {
    const color = colors[i];
    boxes.push(
      <View padding={8} marginBottom={4} backgroundColor="#475569">
        <Label fontSize={12} color="#ffffff">
          Alternate {i}: {color}
        </Label>
      </View>
    );
  }
  
  return boxes;
}

// Function that builds numbered items with decrementing loop
function buildCountdown() {
  const items: any[] = [];
  
  for (let i = 5; i > 0; i--) {
    items.push(
      <View padding={6} marginBottom={2} backgroundColor="#64748b">
        <Label fontSize={12} color="#ffffff">
          Countdown: {i}
        </Label>
      </View>
    );
  }
  
  return items;
}

// Function that accumulates a total using +=
function buildProgressBars() {
  const bars: any[] = [];
  let totalWidth = 0;
  
  for (let i = 1; i <= 5; i++) {
    totalWidth += i * 20;
    bars.push(
      <View padding={4} marginBottom={2} backgroundColor="#0ea5e9" width={totalWidth}>
        <Label fontSize={10} color="#ffffff">
          Width: {totalWidth}px
        </Label>
      </View>
    );
  }
  
  return bars;
}

// Main render function
function render() {
  return (
    <Print
      
    >
      <Section>
        <Page>
          {/* Header */}
          <View padding={16} backgroundColor="#1e293b">
            <Label fontSize={20} fontWeight="bold" color="#ffffff">
              For Loop Test Component
            </Label>
            <Label fontSize={12} color="#94a3b8" marginTop={4}>
              Testing for loops, array.push, i++, i--, and += operators
            </Label>
          </View>

          {/* Section 1: Basic for loop with i++ */}
          <View padding={12} marginTop={8}>
            <Label fontSize={14} fontWeight="bold" marginBottom={8}>
              1. Basic For Loop (i++)
            </Label>
            {buildColorBoxes()}
          </View>

          {/* Section 2: For loop with i += 2 */}
          <View padding={12} marginTop={8}>
            <Label fontSize={14} fontWeight="bold" marginBottom={8}>
              2. Step By 2 (i += 2)
            </Label>
            {buildAlternateBoxes()}
          </View>

          {/* Section 3: Decrementing loop with i-- */}
          <View padding={12} marginTop={8}>
            <Label fontSize={14} fontWeight="bold" marginBottom={8}>
              3. Countdown (i--)
            </Label>
            {buildCountdown()}
          </View>

          {/* Section 4: Accumulating with += */}
          <View padding={12} marginTop={8}>
            <Label fontSize={14} fontWeight="bold" marginBottom={8}>
              4. Progressive Widths (totalWidth += increment)
            </Label>
            {buildProgressBars()}
          </View>

        </Page>
      </Section>
    </Print>
  );
}
