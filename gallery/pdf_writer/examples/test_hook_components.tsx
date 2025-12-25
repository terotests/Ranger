// Test file using hook components
import { View, Label, Section, Page, Print } from "./evg_types";
import { PrintSettingsCard } from "./components/PrintSettingsCard";
import { ImageDataCard } from "./components/ImageDataCard";

// Main render function - uses components that internally call hooks
function render() {
  return (
    <Print format="a4" orientation="portrait">
      <Section>
        <Page>
          {/* Header */}
          <View padding={16} backgroundColor="#3b82f6">
            <Label fontSize={24} fontWeight="bold" color="#ffffff">
              Hook Components Test
            </Label>
            <Label fontSize={14} color="#dbeafe" marginTop={4}>
              Components using usePrintSettings and useImage hooks
            </Label>
          </View>

          {/* Print Settings Component */}
          <View marginTop={12} paddingLeft={16} paddingRight={16}>
            <PrintSettingsCard />
          </View>

     </Page>
     <Page>
          {/* Image Data Component */}
          <View marginTop={12} paddingLeft={16} paddingRight={16}>
            <ImageDataCard src="../assets/images/GPS_test.jpg" />
          </View>

          {/* Info */}
          <View padding={16} marginTop={12}>
            <View padding={12} backgroundColor="#dcfce7" borderRadius={8}>
              <Label fontSize={12} fontWeight="bold" color="#166534">
                How it works:
              </Label>
              <Label fontSize={10} marginTop={4} color="#15803d">
                PrintSettingsCard calls usePrintSettings() internally
              </Label>
              <Label fontSize={10} marginTop={2} color="#15803d">
                ImageDataCard calls useImage(props.src) internally
              </Label>
            </View>
          </View>

        </Page>
      </Section>
    </Print>
  );
}
