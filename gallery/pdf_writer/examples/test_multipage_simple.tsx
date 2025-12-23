// test_multipage_simple.tsx - Simple multi-page test
// Tests basic Print/Section/Page structure without custom components

import { Print, Section, Page, View, Label, Image } from "./evg_types";

function render() {
  return (
    <Print title="Multi-Page Test" author="EVG Demo">
      <Section pageWidth="595" pageHeight="842" margin="0">
        {/* Page 1: Title */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#34495e" padding="50px">
            <Label fontSize="48px" fontWeight="bold" color="#ffffff" textAlign="center">
              Multi-Page Document
            </Label>
            <Label fontSize="24px" color="#ecf0f1" textAlign="center" marginTop="20px">
              Testing Print/Section/Page Structure
            </Label>
          </View>
        </Page>

        {/* Page 2: Blue */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#3498db" padding="50px">
            <Label fontSize="36px" fontWeight="bold" color="#ffffff">
              Page 2 - Blue
            </Label>
            <Label fontSize="18px" color="#ffffff" marginTop="20px">
              This is the second page with a blue background.
            </Label>
          </View>
        </Page>

        {/* Page 3: Green */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#2ecc71" padding="50px">
            <Label fontSize="36px" fontWeight="bold" color="#ffffff">
              Page 3 - Green
            </Label>
            <Label fontSize="18px" color="#ffffff" marginTop="20px">
              This is the third page with a green background.
            </Label>
          </View>
        </Page>

        {/* Page 4: Orange */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#e67e22" padding="50px">
            <Label fontSize="36px" fontWeight="bold" color="#ffffff">
              Page 4 - Orange
            </Label>
            <Label fontSize="18px" color="#ffffff" marginTop="20px">
              This is the fourth page with an orange background.
            </Label>
          </View>
        </Page>

        {/* Page 5: Content with image */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff" padding="40px">
            <Label fontSize="28px" fontWeight="bold" color="#2c3e50" marginBottom="20px">
              Page 5 - With Image
            </Label>
            <Image 
              src="../assets/images/IMG_6573.jpg" 
              width="400px" 
              height="300px" 
              borderRadius="8px"
            />
            <Label fontSize="14px" color="#7f8c8d" marginTop="15px">
              A sample image on the last page.
            </Label>
          </View>
        </Page>
      </Section>
    </Print>
  );
}

export default render;
