// Test file for EVG hooks: usePrintSettings and useImage
import { View, Label, Section, Page, Print, usePrintSettings, useImage } from "./evg_types";

// Main render function - tests both hooks
function render() {
  // Get print settings from the <Print> element
  const settings = usePrintSettings();
  
  // Test useImage hook with actual GPS image
  const img = useImage("../assets/images/GPS_test.jpg");
  
  // Determine layout based on orientation
  const isLandscape = settings.orientation === "landscape";
  const headerColor = isLandscape ? "#059669" : "#3b82f6";
  const headerText = isLandscape ? "Landscape Mode" : "Portrait Mode";
  
  return (
    <Print format="large-square" orientation="portrait">
      <Section>
        <Page>
          {/* Header showing orientation */}
          <View padding={16} backgroundColor={headerColor}>
            <Label fontSize={24} fontWeight="bold" color="#ffffff">
              Hooks Test
            </Label>
            <Label fontSize={16} color="#ffffff" marginTop={4}>
              {headerText}
            </Label>
          </View>

          {/* Print Settings Display */}
          <View padding={16} marginTop={8} backgroundColor="#f8fafc">
            <Label fontSize={16} fontWeight="bold" marginBottom={12} color="#1e293b">
              usePrintSettings() Results:
            </Label>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Format:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{settings.format}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Width:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{settings.width}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Height:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{settings.height}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Orientation:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{settings.orientation}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8}>
              <Label fontSize={14} color="#64748b">Page Count:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{settings.pageCount}</Label>
            </View>
          </View>

          {/* Image Metadata Display */}
          <View padding={16} marginTop={8} backgroundColor="#fef3c7">
            <Label fontSize={16} fontWeight="bold" marginBottom={12} color="#92400e">
              Image Metadata (GPS_test.jpg):
            </Label>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Image Width:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{img.width}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Image Height:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{img.height}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Color Space:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{img.colorSpace}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8} marginBottom={8}>
              <Label fontSize={14} color="#64748b">Bits per Component:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{img.bitsPerComponent}</Label>
            </View>
            
            <View padding={12} backgroundColor="#ffffff" borderRadius={8}>
              <Label fontSize={14} color="#64748b">EXIF Orientation:</Label>
              <Label fontSize={18} fontWeight="bold" color="#0f172a">{img.orientation}</Label>
            </View>
          </View>

          {/* Status Box */}
          <View padding={12} marginTop={16} backgroundColor="#dcfce7">
            <Label fontSize={12} fontWeight="bold" color="#166534">
              Hook Implementation Status:
            </Label>
            <Label fontSize={10} marginTop={4} color="#15803d">
              usePrintSettings() - Working (returns Print element settings)
            </Label>
            <Label fontSize={10} marginTop={2} color="#ca8a04">
              useImage() - See page 2 for image metadata
            </Label>
          </View>

        </Page>

        {/* Page 2: Image Metadata */}
        <Page>
          {/* Header */}
          <View padding={16} backgroundColor="#92400e">
            <Label fontSize={24} fontWeight="bold" color="#ffffff">
              useImage() Results
            </Label>
            <Label fontSize={14} color="#fef3c7" marginTop={4}>
              Metadata from GPS_test.jpg
            </Label>
          </View>

          {/* Image Metadata Display */}
          <View padding={16} marginTop={8} backgroundColor="#fef3c7">
            <Label fontSize={14} fontWeight="bold" marginBottom={8} color="#92400e">
              Basic Image Info:
            </Label>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8} marginBottom={6}>
              <Label fontSize={12} color="#64748b">Image Width:</Label>
              <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.width}</Label>
            </View>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8} marginBottom={6}>
              <Label fontSize={12} color="#64748b">Image Height:</Label>
              <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.height}</Label>
            </View>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8} marginBottom={6}>
              <Label fontSize={12} color="#64748b">Color Space:</Label>
              <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.colorSpace}</Label>
            </View>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8} marginBottom={6}>
              <Label fontSize={12} color="#64748b">Bits per Component:</Label>
              <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.bitsPerComponent}</Label>
            </View>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8}>
              <Label fontSize={12} color="#64748b">EXIF Orientation:</Label>
              <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.orientation}</Label>
            </View>
          </View>

          {/* EXIF Metadata */}
          <View padding={16} marginTop={8} backgroundColor="#e0f2fe">
            <Label fontSize={14} fontWeight="bold" marginBottom={8} color="#0369a1">
              EXIF Metadata:
            </Label>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8} marginBottom={6}>
              <Label fontSize={12} color="#64748b">Camera:</Label>
              <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.camera}</Label>
            </View>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8}>
              <Label fontSize={12} color="#64748b">Created At:</Label>
              <Label fontSize={16} fontWeight="bold" color="#0f172a">{img.createdAt}</Label>
            </View>
          </View>

          {/* GPS Info */}
          <View padding={16} marginTop={8} backgroundColor="#dcfce7">
            <Label fontSize={14} fontWeight="bold" marginBottom={8} color="#166534">
              GPS Data (from EXIF):
            </Label>
            
            <View padding={10} backgroundColor="#ffffff" borderRadius={8}>
              <Label fontSize={12} color="#64748b">GPS Coordinates:</Label>
              <Label fontSize={14} fontWeight="bold" color="#0f172a">
                (ResourceLoader integration pending)
              </Label>
            </View>
          </View>

        </Page>
      </Section>
    </Print>
  );
}
