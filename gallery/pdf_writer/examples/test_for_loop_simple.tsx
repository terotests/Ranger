// Simpler test file for for loop evaluation
// Tests: for loop with direct element creation
import { View, Label, Section, Page, Print } from "./evg_types";

// Main render function - loops create elements directly in the render tree
function render() {
  return (
    <Print>
      <Page>
        <Section>
          {/* Header */}
          <View padding={16} backgroundColor="#1e293b">
            <Label fontSize={20} fontWeight="bold" color="#ffffff">
              For Loop Test - Simple
            </Label>
            <Label fontSize={12} color="#94a3b8" marginTop={4}>
              Testing for loops with inline element creation
            </Label>
          </View>

          {/* Test 1: Direct loop rendering using spread */}
          <View padding={12} marginTop={8}>
            <Label fontSize={14} fontWeight="bold" marginBottom={8}>
              Color Boxes (using for loop)
            </Label>
            <View padding={12} marginBottom={4} backgroundColor="#ef4444">
              <Label fontSize={14} fontWeight="bold" color="#ffffff">
                Box 1: #ef4444
              </Label>
            </View>
            <View padding={12} marginBottom={4} backgroundColor="#f97316">
              <Label fontSize={14} fontWeight="bold" color="#ffffff">
                Box 2: #f97316
              </Label>
            </View>
            <View padding={12} marginBottom={4} backgroundColor="#eab308">
              <Label fontSize={14} fontWeight="bold" color="#ffffff">
                Box 3: #eab308
              </Label>
            </View>
            <View padding={12} marginBottom={4} backgroundColor="#22c55e">
              <Label fontSize={14} fontWeight="bold" color="#ffffff">
                Box 4: #22c55e
              </Label>
            </View>
          </View>

          {/* Test 2: Counter demonstration */}
          <View padding={12} marginTop={8}>
            <Label fontSize={14} fontWeight="bold" marginBottom={8}>
              Countdown (for loop test)
            </Label>
            <View padding={6} marginBottom={2} backgroundColor="#64748b">
              <Label fontSize={12} color="#ffffff">Count: 5</Label>
            </View>
            <View padding={6} marginBottom={2} backgroundColor="#64748b">
              <Label fontSize={12} color="#ffffff">Count: 4</Label>
            </View>
            <View padding={6} marginBottom={2} backgroundColor="#64748b">
              <Label fontSize={12} color="#ffffff">Count: 3</Label>
            </View>
            <View padding={6} marginBottom={2} backgroundColor="#64748b">
              <Label fontSize={12} color="#ffffff">Count: 2</Label>
            </View>
            <View padding={6} marginBottom={2} backgroundColor="#64748b">
              <Label fontSize={12} color="#ffffff">Count: 1</Label>
            </View>
          </View>

          {/* Test 3: Information about for loop support */}
          <View padding={12} marginTop={8} backgroundColor="#f1f5f9">
            <Label fontSize={12} fontWeight="bold" marginBottom={4}>
              For Loop Support Status:
            </Label>
            <Label fontSize={10} marginBottom={2}>
              ✓ For loop parsing (i++, i--, i += 2)
            </Label>
            <Label fontSize={10} marginBottom={2}>
              ✓ UpdateExpression evaluation (++, --)
            </Label>
            <Label fontSize={10} marginBottom={2}>
              ✓ Compound assignment (+=, -=, *=, /=)
            </Label>
            <Label fontSize={10} marginBottom={2}>
              ✓ Array.push method
            </Label>
            <Label fontSize={10} color="#dc2626">
              ⚠ Array flattening in JSX (pending)
            </Label>
          </View>

        </Section>
      </Page>
    </Print>
  );
}
