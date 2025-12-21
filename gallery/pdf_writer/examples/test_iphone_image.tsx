// test_iphone_image.tsx - Test iPhone 16 JPEG decoding
// Tests the Go-compiled JPEG decoder with a high-resolution iPhone photo

import { Print, Section, Page, View, Label, Image } from "./evg_types";

const iphonePhoto = "../assets/images/IMG_5931.jpg";

function render() {
  return (
    <Print
      title="iPhone 16 Image Test"
      author="Go JPEG Decoder Test"
      imageQuality="85"
      maxImageSize="1200"
    >
      <Section pageWidth="595" pageHeight="842" margin="30">
        <Page>
          <View width="100%" height="100%" padding="20px" backgroundColor="#f5f5f5">
            <Label fontSize="24px" fontWeight="bold" color="#333">
              iPhone 16 Image Test
            </Label>
            
            <View marginTop="20px">
              <Image 
                src={iphonePhoto}
                width="400px" 
                height="300px"
              />
            </View>
            
            <Label fontSize="12px" color="#666" marginTop="10px">
              Testing JPEG decode with iPhone 16 photo (4284x5712)
            </Label>
          </View>
        </Page>
      </Section>
    </Print>
  );
}
