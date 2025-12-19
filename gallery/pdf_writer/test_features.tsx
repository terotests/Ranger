import { Print, Section, Page, View, Label, Image } from "./evg_types";

function render() {
  return (
    <Print title="EVG Features Showcase" author="EVG Demo">
      <Section pageWidth="595" pageHeight="842" margin="40px">
        
        {/* Page 1: Font Showcase */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label fontSize="32px" fontWeight="bold" color="#2c3e50" marginBottom="30px">
              Page 1: Font Showcase
            </Label>

            <Label fontSize="18px" fontFamily="Cinzel" color="#e74c3c" marginTop="20px">
              Cinzel Font - Elegant Serif
            </Label>
            
            <Label fontSize="16px" fontFamily="Josefin Sans" color="#3498db" marginTop="15px">
              Josefin Sans - Modern Sans-Serif
            </Label>
            
            <Label fontSize="14px" fontFamily="Open Sans" color="#27ae60" marginTop="15px">
              Open Sans - Clean and Readable
            </Label>
            
            <Label fontSize="18px" fontFamily="Gloria Hallelujah" color="#9b59b6" marginTop="15px">
              Gloria Hallelujah - Handwritten Style
            </Label>
            
            <Label fontSize="20px" fontFamily="Great Vibes" color="#e67e22" marginTop="15px">
              Great Vibes - Elegant Script
            </Label>
            
            <Label fontSize="16px" fontFamily="Kaushan Script" color="#34495e" marginTop="15px">
              Kaushan Script - Brush Style
            </Label>

            <View marginTop="30px" padding="15px" backgroundColor="#ecf0f1" borderRadius="5px">
              <Label fontSize="12px" fontWeight="bold" color="#7f8c8d">
                Font Sizes Demo:
              </Label>
              <Label fontSize="10px" color="#2c3e50" marginTop="5px">10px - Small text</Label>
              <Label fontSize="12px" color="#2c3e50" marginTop="5px">12px - Normal text</Label>
              <Label fontSize="14px" color="#2c3e50" marginTop="5px">14px - Medium text</Label>
              <Label fontSize="16px" color="#2c3e50" marginTop="5px">16px - Large text</Label>
              <Label fontSize="20px" color="#2c3e50" marginTop="5px">20px - Extra large</Label>
            </View>
          </View>
        </Page>

        {/* Page 2: Layout Directions */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label fontSize="32px" fontWeight="bold" color="#2c3e50" marginBottom="30px">
              Page 2: Layout Directions
            </Label>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="10px">
              Horizontal Row Layout:
            </Label>
            <View flexDirection="row" width="100%" marginBottom="20px">
              <View width="30%" height="60px" backgroundColor="#e74c3c" padding="10px">
                <Label fontSize="12px" color="#ffffff">Box 1</Label>
              </View>
              <View width="30%" height="60px" backgroundColor="#3498db" padding="10px">
                <Label fontSize="12px" color="#ffffff">Box 2</Label>
              </View>
              <View width="30%" height="60px" backgroundColor="#2ecc71" padding="10px">
                <Label fontSize="12px" color="#ffffff">Box 3</Label>
              </View>
            </View>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginTop="20px" marginBottom="10px">
              Vertical Column Layout:
            </Label>
            <View flexDirection="column" width="50%" marginBottom="20px">
              <View height="40px" backgroundColor="#9b59b6" padding="10px" marginBottom="5px">
                <Label fontSize="12px" color="#ffffff">Item 1</Label>
              </View>
              <View height="40px" backgroundColor="#e67e22" padding="10px" marginBottom="5px">
                <Label fontSize="12px" color="#ffffff">Item 2</Label>
              </View>
              <View height="40px" backgroundColor="#1abc9c" padding="10px" marginBottom="5px">
                <Label fontSize="12px" color="#ffffff">Item 3</Label>
              </View>
            </View>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginTop="20px" marginBottom="10px">
              Flex Layout:
            </Label>
            <View flexDirection="row" width="100%" height="60px">
              <View flex="1" backgroundColor="#f39c12" padding="10px" marginRight="5px">
                <Label fontSize="12px" color="#ffffff">Flex 1</Label>
              </View>
              <View flex="2" backgroundColor="#16a085" padding="10px" marginRight="5px">
                <Label fontSize="12px" color="#ffffff">Flex 2 (wider)</Label>
              </View>
              <View flex="1" backgroundColor="#c0392b" padding="10px">
                <Label fontSize="12px" color="#ffffff">Flex 1</Label>
              </View>
            </View>
          </View>
        </Page>

        {/* Page 3: Colors and Styling */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label fontSize="32px" fontWeight="bold" color="#2c3e50" marginBottom="30px">
              Page 3: Colors and Styling
            </Label>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Background Colors:
            </Label>
            <View flexDirection="row" width="100%" marginBottom="25px">
              <View width="18%" height="80px" backgroundColor="#e74c3c" marginRight="2%">
                <Label fontSize="10px" color="#ffffff" padding="5px">Red</Label>
              </View>
              <View width="18%" height="80px" backgroundColor="#3498db" marginRight="2%">
                <Label fontSize="10px" color="#ffffff" padding="5px">Blue</Label>
              </View>
              <View width="18%" height="80px" backgroundColor="#2ecc71" marginRight="2%">
                <Label fontSize="10px" color="#ffffff" padding="5px">Green</Label>
              </View>
              <View width="18%" height="80px" backgroundColor="#f39c12" marginRight="2%">
                <Label fontSize="10px" color="#ffffff" padding="5px">Orange</Label>
              </View>
              <View width="18%" height="80px" backgroundColor="#9b59b6">
                <Label fontSize="10px" color="#ffffff" padding="5px">Purple</Label>
              </View>
            </View>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Padding and Margins:
            </Label>
            <View backgroundColor="#ecf0f1" padding="20px" marginBottom="25px">
              <Label fontSize="12px" color="#2c3e50">This box has 20px padding on all sides</Label>
              <View backgroundColor="#ffffff" padding="15px" marginTop="10px">
                <Label fontSize="11px" color="#7f8c8d">Nested box with 15px padding and 10px top margin</Label>
              </View>
            </View>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Border Radius:
            </Label>
            <View flexDirection="row" width="100%">
              <View width="30%" height="80px" backgroundColor="#1abc9c" borderRadius="5px" marginRight="5%" padding="10px">
                <Label fontSize="11px" color="#ffffff">5px radius</Label>
              </View>
              <View width="30%" height="80px" backgroundColor="#e67e22" borderRadius="10px" marginRight="5%" padding="10px">
                <Label fontSize="11px" color="#ffffff">10px radius</Label>
              </View>
              <View width="30%" height="80px" backgroundColor="#c0392b" borderRadius="20px" padding="10px">
                <Label fontSize="11px" color="#ffffff">20px radius</Label>
              </View>
            </View>
          </View>
        </Page>

        {/* Page 4: Images */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label fontSize="32px" fontWeight="bold" color="#2c3e50" marginBottom="30px">
              Page 4: Images
            </Label>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Regular Image:
            </Label>
            <Image 
              src="./bin/IMG_6573.jpg" 
              width="200px" 
              height="150px" 
              marginBottom="25px"
            />

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Rounded Image:
            </Label>
            <Image 
              src="./bin/IMG_6573.jpg" 
              width="150px" 
              height="150px" 
              borderRadius="75px"
              marginBottom="25px"
            />

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Multiple Images in Row:
            </Label>
            <View flexDirection="row" width="100%">
              <Image 
                src="./bin/IMG_6573.jpg" 
                width="120px" 
                height="90px" 
                marginRight="10px"
                borderRadius="10px"
              />
              <Image 
                src="./bin/IMG_6573.jpg" 
                width="120px" 
                height="90px" 
                marginRight="10px"
                borderRadius="10px"
              />
              <Image 
                src="./bin/IMG_6573.jpg" 
                width="120px" 
                height="90px" 
                borderRadius="10px"
              />
            </View>
          </View>
        </Page>

        {/* Page 5: Complex Layouts */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label fontSize="32px" fontWeight="bold" color="#2c3e50" marginBottom="30px">
              Page 5: Complex Layouts
            </Label>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Card Layout:
            </Label>
            <View backgroundColor="#ecf0f1" padding="20px" borderRadius="10px" marginBottom="25px">
              <Label fontSize="18px" fontWeight="bold" color="#2c3e50" marginBottom="10px">
                Feature Card
              </Label>
              <Label fontSize="12px" color="#7f8c8d" marginBottom="15px">
                This is a card component with padding, border radius, and multiple text elements.
              </Label>
              <View flexDirection="row" width="100%">
                <View flex="1" backgroundColor="#3498db" padding="10px" marginRight="10px" borderRadius="5px">
                  <Label fontSize="11px" color="#ffffff">Action 1</Label>
                </View>
                <View flex="1" backgroundColor="#2ecc71" padding="10px" borderRadius="5px">
                  <Label fontSize="11px" color="#ffffff">Action 2</Label>
                </View>
              </View>
            </View>

            <Label fontSize="16px" fontWeight="bold" color="#34495e" marginBottom="15px">
              Grid Layout:
            </Label>
            <View flexDirection="row" width="100%" marginBottom="10px">
              <View width="48%" height="60px" backgroundColor="#e74c3c" padding="10px" marginRight="4%" borderRadius="5px">
                <Label fontSize="11px" color="#ffffff">Grid Item 1</Label>
              </View>
              <View width="48%" height="60px" backgroundColor="#9b59b6" padding="10px" borderRadius="5px">
                <Label fontSize="11px" color="#ffffff">Grid Item 2</Label>
              </View>
            </View>
            <View flexDirection="row" width="100%">
              <View width="48%" height="60px" backgroundColor="#f39c12" padding="10px" marginRight="4%" borderRadius="5px">
                <Label fontSize="11px" color="#ffffff">Grid Item 3</Label>
              </View>
              <View width="48%" height="60px" backgroundColor="#1abc9c" padding="10px" borderRadius="5px">
                <Label fontSize="11px" color="#ffffff">Grid Item 4</Label>
              </View>
            </View>

            <View marginTop="30px" padding="15px" backgroundColor="#fff3cd" borderRadius="5px">
              <Label fontSize="12px" fontWeight="bold" color="#856404">
                Note: SVG Path elements are not yet implemented (see ISSUES.md)
              </Label>
            </View>
          </View>
        </Page>

      </Section>
    </Print>
  );
}

export default render;
