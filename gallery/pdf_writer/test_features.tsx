import { Print, Section, Page, View, Label, Image, Path } from "./evg_types";

function render() {
  return (
    <Print title="EVG Features Showcase" author="EVG Demo">
      <Section pageWidth="595" pageHeight="842" margin="40px">
        {/* Page 1: Font Showcase */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="30px"
            >
              Page 1: Font Showcase
            </Label>

            <Label
              fontSize="18px"
              fontFamily="Cinzel"
              color="#e74c3c"
              marginTop="20px"
            >
              Cinzel Font - Elegant Serif
            </Label>

            <Label
              fontSize="16px"
              fontFamily="Josefin Sans"
              color="#3498db"
              marginTop="15px"
            >
              Josefin Sans - Modern Sans-Serif
            </Label>

            <Label
              fontSize="14px"
              fontFamily="Open Sans"
              color="#27ae60"
              marginTop="15px"
            >
              Open Sans - Clean and Readable
            </Label>

            <Label
              fontSize="18px"
              fontFamily="Gloria Hallelujah"
              color="#9b59b6"
              marginTop="15px"
            >
              Gloria Hallelujah - Handwritten Style
            </Label>

            <Label
              fontSize="20px"
              fontFamily="Great Vibes"
              color="#e67e22"
              marginTop="15px"
            >
              Great Vibes - Elegant Script
            </Label>

            <Label
              fontSize="16px"
              fontFamily="Kaushan Script"
              color="#34495e"
              marginTop="15px"
            >
              Kaushan Script - Brush Style
            </Label>

            <View
              marginTop="30px"
              padding="15px"
              backgroundColor="#ecf0f1"
              borderRadius="5px"
            >
              <Label fontSize="12px" fontWeight="bold" color="#7f8c8d">
                Font Sizes Demo:
              </Label>
              <Label fontSize="10px" color="#2c3e50" marginTop="5px">
                10px - Small text
              </Label>
              <Label fontSize="12px" color="#2c3e50" marginTop="5px">
                12px - Normal text
              </Label>
              <Label fontSize="14px" color="#2c3e50" marginTop="5px">
                14px - Medium text
              </Label>
              <Label fontSize="16px" color="#2c3e50" marginTop="5px">
                16px - Large text
              </Label>
              <Label fontSize="20px" color="#2c3e50" marginTop="5px">
                20px - Extra large
              </Label>
            </View>
          </View>
        </Page>

        {/* Page 2: Layout Directions */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="30px"
            >
              Page 2: Layout Directions
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Horizontal Row Layout:
            </Label>
            <View flexDirection="row" width="100%" marginBottom="20px">
              <View
                width="30%"
                height="60px"
                backgroundColor="#e74c3c"
                padding="10px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Box 1
                </Label>
              </View>
              <View
                width="30%"
                height="60px"
                backgroundColor="#3498db"
                padding="10px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Box 2
                </Label>
              </View>
              <View
                width="30%"
                height="60px"
                backgroundColor="#2ecc71"
                padding="10px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Box 3
                </Label>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginTop="20px"
              marginBottom="10px"
            >
              Vertical Column Layout:
            </Label>
            <View flexDirection="column" width="50%" marginBottom="20px">
              <View
                height="40px"
                backgroundColor="#9b59b6"
                padding="10px"
                marginBottom="5px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Item 1
                </Label>
              </View>
              <View
                height="40px"
                backgroundColor="#e67e22"
                padding="10px"
                marginBottom="5px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Item 2
                </Label>
              </View>
              <View
                height="40px"
                backgroundColor="#1abc9c"
                padding="10px"
                marginBottom="5px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Item 3
                </Label>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginTop="20px"
              marginBottom="10px"
            >
              Flex Layout:
            </Label>
            <View flexDirection="row" width="100%" height="60px">
              <View
                flex="1"
                backgroundColor="#f39c12"
                padding="10px"
                marginRight="5px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Flex 1
                </Label>
              </View>
              <View
                flex="2"
                backgroundColor="#16a085"
                padding="10px"
                marginRight="5px"
              >
                <Label fontSize="12px" color="#ffffff">
                  Flex 2 (wider)
                </Label>
              </View>
              <View flex="1" backgroundColor="#c0392b" padding="10px">
                <Label fontSize="12px" color="#ffffff">
                  Flex 1
                </Label>
              </View>
            </View>
          </View>
        </Page>

        {/* Page 3: Colors and Styling */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="30px"
            >
              Page 3: Colors and Styling
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Background Colors:
            </Label>
            <View flexDirection="row" width="100%" marginBottom="25px">
              <View
                width="18%"
                height="80px"
                backgroundColor="#e74c3c"
                marginRight="2%"
              >
                <Label fontSize="10px" color="#ffffff" padding="5px">
                  Red
                </Label>
              </View>
              <View
                width="18%"
                height="80px"
                backgroundColor="#3498db"
                marginRight="2%"
              >
                <Label fontSize="10px" color="#ffffff" padding="5px">
                  Blue
                </Label>
              </View>
              <View
                width="18%"
                height="80px"
                backgroundColor="#2ecc71"
                marginRight="2%"
              >
                <Label fontSize="10px" color="#ffffff" padding="5px">
                  Green
                </Label>
              </View>
              <View
                width="18%"
                height="80px"
                backgroundColor="#f39c12"
                marginRight="2%"
              >
                <Label fontSize="10px" color="#ffffff" padding="5px">
                  Orange
                </Label>
              </View>
              <View width="18%" height="80px" backgroundColor="#9b59b6">
                <Label fontSize="10px" color="#ffffff" padding="5px">
                  Purple
                </Label>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Padding and Margins:
            </Label>
            <View backgroundColor="#ecf0f1" padding="20px" marginBottom="25px">
              <Label fontSize="12px" color="#2c3e50">
                This box has 20px padding on all sides
              </Label>
              <View backgroundColor="#ffffff" padding="15px" marginTop="10px">
                <Label fontSize="11px" color="#7f8c8d">
                  Nested box with 15px padding and 10px top margin
                </Label>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Border Radius:
            </Label>
            <View flexDirection="row" width="100%">
              <View
                width="30%"
                height="80px"
                backgroundColor="#1abc9c"
                borderRadius="5px"
                marginRight="5%"
                padding="10px"
              >
                <Label fontSize="11px" color="#ffffff">
                  5px radius
                </Label>
              </View>
              <View
                width="30%"
                height="80px"
                backgroundColor="#e67e22"
                borderRadius="10px"
                marginRight="5%"
                padding="10px"
              >
                <Label fontSize="11px" color="#ffffff">
                  10px radius
                </Label>
              </View>
              <View
                width="30%"
                height="80px"
                backgroundColor="#c0392b"
                borderRadius="20px"
                padding="10px"
              >
                <Label fontSize="11px" color="#ffffff">
                  20px radius
                </Label>
              </View>
            </View>
          </View>
        </Page>

        {/* Page 4: Images */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="30px"
            >
              Page 4: Images
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Regular Image:
            </Label>
            <Image
              src="./bin/IMG_6573.jpg"
              width="200px"
              height="150px"
              marginBottom="25px"
            />

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Rounded Image:
            </Label>
            <Image
              src="./bin/IMG_6573.jpg"
              width="150px"
              height="150px"
              borderRadius="75px"
              marginBottom="25px"
            />

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
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
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="30px"
            >
              Page 5: Complex Layouts
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Card Layout:
            </Label>
            <View
              backgroundColor="#ecf0f1"
              padding="20px"
              borderRadius="10px"
              marginBottom="25px"
            >
              <Label
                fontSize="18px"
                fontWeight="bold"
                color="#2c3e50"
                marginBottom="10px"
              >
                Feature Card
              </Label>
              <Label fontSize="12px" color="#7f8c8d" marginBottom="15px">
                This is a card component with padding, border radius, and
                multiple text elements.
              </Label>
              <View flexDirection="row" width="100%">
                <View
                  flex="1"
                  backgroundColor="#3498db"
                  padding="10px"
                  marginRight="10px"
                  borderRadius="5px"
                >
                  <Label fontSize="11px" color="#ffffff">
                    Action 1
                  </Label>
                </View>
                <View
                  flex="1"
                  backgroundColor="#2ecc71"
                  padding="10px"
                  borderRadius="5px"
                >
                  <Label fontSize="11px" color="#ffffff">
                    Action 2
                  </Label>
                </View>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Grid Layout:
            </Label>
            <View flexDirection="row" width="100%" marginBottom="10px">
              <View
                width="48%"
                height="60px"
                backgroundColor="#e74c3c"
                padding="10px"
                marginRight="4%"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff">
                  Grid Item 1
                </Label>
              </View>
              <View
                width="48%"
                height="60px"
                backgroundColor="#9b59b6"
                padding="10px"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff">
                  Grid Item 2
                </Label>
              </View>
            </View>
            <View flexDirection="row" width="100%">
              <View
                width="48%"
                height="60px"
                backgroundColor="#f39c12"
                padding="10px"
                marginRight="4%"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff">
                  Grid Item 3
                </Label>
              </View>
              <View
                width="48%"
                height="60px"
                backgroundColor="#1abc9c"
                padding="10px"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff">
                  Grid Item 4
                </Label>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginTop="25px"
              marginBottom="15px"
            >
              SVG Path Shapes:
            </Label>
            <View flexDirection="row" marginBottom="15px">
              <View
                width="70px"
                height="70px"
                backgroundColor="#f0f0f0"
                padding="8px"
                marginRight="15px"
                borderRadius="5px"
              >
                <Path
                  d="M25,10 L30,20 L40,22 L32,30 L35,40 L25,35 L15,40 L18,30 L10,22 L20,20 Z"
                  width="54px"
                  height="54px"
                  fill="#f39c12"
                />
              </View>
              <View
                width="70px"
                height="70px"
                backgroundColor="#f0f0f0"
                padding="8px"
                marginRight="15px"
                borderRadius="5px"
              >
                <Path
                  d="M50,25 C50,11.2 38.8,0 25,0 S0,11.2 0,25 S11.2,50 25,50 S50,38.8 50,25 Z"
                  width="54px"
                  height="54px"
                  fill="#3498db"
                />
              </View>
              <View
                width="70px"
                height="70px"
                backgroundColor="#f0f0f0"
                padding="8px"
                marginRight="15px"
                borderRadius="5px"
              >
                <Path
                  d="M25,45 L10,30 C5,25 5,15 10,10 C15,5 25,10 25,10 C25,10 35,5 40,10 C45,15 45,25 40,30 Z"
                  width="54px"
                  height="54px"
                  fill="#e74c3c"
                />
              </View>
              <View
                width="70px"
                height="70px"
                backgroundColor="#f0f0f0"
                padding="8px"
                borderRadius="5px"
              >
                <Path
                  d="M30,5 L55,30 L30,55 L5,30 Z"
                  width="54px"
                  height="54px"
                  fill="#9b59b6"
                  stroke="#8e44ad"
                  strokeWidth={2}
                />
              </View>
            </View>

            <Label fontSize="12px" color="#7f8c8d" marginTop="10px">
              Path shapes: Star, Circle (Bezier), Heart, Diamond with stroke
            </Label>
          </View>
        </Page>

        {/* Page 6: Text Alignments */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="30px"
            >
              Page 6: Text Alignments
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Left Alignment (default):
            </Label>
            <View
              width="100%"
              padding="15px"
              backgroundColor="#ecf0f1"
              marginBottom="25px"
              borderRadius="5px"
            >
              <Label fontSize="14px" color="#2c3e50" textAlign="left">
                This text is aligned to the left. This is the default alignment
                for most text content.
              </Label>
              <Label
                fontSize="12px"
                color="#7f8c8d"
                textAlign="left"
                marginTop="10px"
              >
                Multiple lines of left-aligned text will naturally flow from the
                left edge of the container, creating a clean and readable layout
                that is familiar to most readers.
              </Label>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Center Alignment:
            </Label>
            <View
              width="100%"
              padding="15px"
              backgroundColor="#e8f8f5"
              marginBottom="25px"
              borderRadius="5px"
            >
              <Label fontSize="14px" color="#16a085" textAlign="center">
                This text is centered in its container.
              </Label>
              <Label
                fontSize="12px"
                color="#1abc9c"
                textAlign="center"
                marginTop="10px"
              >
                Center-aligned text is great for headlines, titles, and
                emphasis.
              </Label>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Right Alignment:
            </Label>
            <View
              width="100%"
              padding="15px"
              backgroundColor="#fef5e7"
              marginBottom="25px"
              borderRadius="5px"
            >
              <Label fontSize="14px" color="#d68910" textAlign="right">
                This text is aligned to the right edge.
              </Label>
              <Label
                fontSize="12px"
                color="#f39c12"
                textAlign="right"
                marginTop="10px"
              >
                Right alignment is useful for certain design elements and
                languages that read from right to left.
              </Label>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Justify Alignment:
            </Label>
            <View
              width="100%"
              padding="15px"
              backgroundColor="#fdeaea"
              marginBottom="20px"
              borderRadius="5px"
            >
              <Label fontSize="14px" color="#c0392b" textAlign="justify">
                This text is justified, meaning it is aligned to both the left
                and right edges.
              </Label>
              <Label
                fontSize="12px"
                color="#e74c3c"
                textAlign="justify"
                marginTop="10px"
              >
                {`Justified text creates clean, even edges on both sides of a text
                block. This is commonly used in newspapers and books to create a
                formal, structured appearance. The spacing between words is
                adjusted to ensure the text reaches both edges`}
              </Label>
            </View>

            <Label
              fontSize="14px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Mixed Alignment Example:
            </Label>
            <View flexDirection="row" width="100%">
              <View
                width="30%"
                backgroundColor="#3498db"
                padding="10px"
                marginRight="5%"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff" textAlign="left">
                  Left
                </Label>
              </View>
              <View
                width="30%"
                backgroundColor="#2ecc71"
                padding="10px"
                marginRight="5%"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff" textAlign="center">
                  Center
                </Label>
              </View>
              <View
                width="30%"
                backgroundColor="#e74c3c"
                padding="10px"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff" textAlign="right">
                  Right
                </Label>
              </View>
            </View>
          </View>
        </Page>

        {/* Page 7: Element Alignment */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="25px"
            >
              Page 7: Element Alignment
            </Label>

            <Label fontSize="14px" color="#7f8c8d" marginBottom="20px">
              Using align and verticalAlign for element positioning
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Horizontal Alignment (align):
            </Label>

            <View
              width="100%"
              height="50px"
              backgroundColor="#ecf0f1"
              flexDirection="row"
              align="left"
              marginBottom="10px"
              borderRadius="5px"
              padding="5px"
            >
              <View
                width="60px"
                height="40px"
                backgroundColor="#3498db"
                borderRadius="3px"
              >
                <Label fontSize="10px" color="#ffffff" textAlign="center">
                  left
                </Label>
              </View>
            </View>

            <View
              width="100%"
              height="50px"
              backgroundColor="#ecf0f1"
              flexDirection="row"
              align="center"
              marginBottom="10px"
              borderRadius="5px"
              padding="5px"
            >
              <View
                width="60px"
                height="40px"
                backgroundColor="#2ecc71"
                borderRadius="3px"
              >
                <Label fontSize="10px" color="#ffffff" textAlign="center">
                  center
                </Label>
              </View>
            </View>

            <View
              width="100%"
              height="50px"
              backgroundColor="#ecf0f1"
              flexDirection="row"
              align="right"
              marginBottom="15px"
              borderRadius="5px"
              padding="5px"
            >
              <View
                width="60px"
                height="40px"
                backgroundColor="#e74c3c"
                borderRadius="3px"
              >
                <Label fontSize="10px" color="#ffffff" textAlign="center">
                  right
                </Label>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Vertical Alignment (verticalAlign):
            </Label>

            <View flexDirection="row" width="100%" marginBottom="15px">
              <View
                width="30%"
                height="80px"
                backgroundColor="#e8f8f5"
                flexDirection="row"
                verticalAlign="top"
                marginRight="5%"
                borderRadius="5px"
                padding="5px"
              >
                <View
                  width="50px"
                  height="30px"
                  backgroundColor="#1abc9c"
                  borderRadius="3px"
                >
                  <Label fontSize="8px" color="#ffffff" textAlign="center">
                    top
                  </Label>
                </View>
              </View>
              <View
                width="30%"
                height="80px"
                backgroundColor="#fef5e7"
                flexDirection="row"
                verticalAlign="center"
                marginRight="5%"
                borderRadius="5px"
                padding="5px"
              >
                <View
                  width="50px"
                  height="30px"
                  backgroundColor="#f39c12"
                  borderRadius="3px"
                >
                  <Label fontSize="8px" color="#ffffff" textAlign="center">
                    center
                  </Label>
                </View>
              </View>
              <View
                width="30%"
                height="80px"
                backgroundColor="#fdeaea"
                flexDirection="row"
                verticalAlign="bottom"
                borderRadius="5px"
                padding="5px"
              >
                <View
                  width="50px"
                  height="30px"
                  backgroundColor="#e74c3c"
                  borderRadius="3px"
                >
                  <Label fontSize="8px" color="#ffffff" textAlign="center">
                    bottom
                  </Label>
                </View>
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="10px"
            >
              Combined Alignment (Center Both):
            </Label>

            <View
              width="100%"
              height="100px"
              backgroundColor="#f5eef8"
              flexDirection="row"
              align="center"
              verticalAlign="center"
              borderRadius="5px"
            >
              <View
                width="120px"
                height="50px"
                backgroundColor="#8e44ad"
                borderRadius="5px"
              >
                <Label fontSize="11px" color="#ffffff" textAlign="center">
                  Centered Box
                </Label>
              </View>
            </View>

            <Label fontSize="12px" color="#7f8c8d" marginTop="15px">
              Properties: align (left/center/right), verticalAlign
              (top/center/bottom)
            </Label>
          </View>
        </Page>

        {/* Page 8: Clip Paths */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="32px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="25px"
            >
              Page 8: Clip Paths
            </Label>

            <Label fontSize="14px" color="#7f8c8d" marginBottom="20px">
              Using clipPath to mask content to SVG shapes
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Image Clipped to Circle:
            </Label>

            <View
              width="150px"
              height="150px"
              marginBottom="20px"
              clipPath="M75,37.5 C75,58.2 58.2,75 37.5,75 C16.8,75 0,58.2 0,37.5 C0,16.8 16.8,0 37.5,0 C58.2,0 75,16.8 75,37.5 Z"
            >
              <Image src="./bin/IMG_6573.jpg" width="150px" height="150px" />
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Image Clipped to Star:
            </Label>

            <View
              width="150px"
              height="150px"
              marginBottom="20px"
              clipPath="M75,15 L90,60 L135,69 L99,105 L109,150 L75,124 L41,150 L51,105 L15,69 L60,60 Z"
            >
              <Image src="./bin/IMG_6573.jpg" width="150px" height="150px" />
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Views with Colored Backgrounds Clipped to Heart:
            </Label>

            <View flexDirection="row">
              <View
                width="100px"
                height="100px"
                marginRight="15px"
                backgroundColor="#e74c3c"
                clipPath="M50,90 L20,60 C10,50 10,30 20,20 C30,10 50,20 50,20 C50,20 70,10 80,20 C90,30 90,50 80,60 Z"
              />
              <View
                width="100px"
                height="100px"
                marginRight="15px"
                backgroundColor="#3498db"
                clipPath="M50,90 L20,60 C10,50 10,30 20,20 C30,10 50,20 50,20 C50,20 70,10 80,20 C90,30 90,50 80,60 Z"
              />
              <View
                width="100px"
                height="100px"
                backgroundColor="#2ecc71"
                clipPath="M50,90 L20,60 C10,50 10,30 20,20 C30,10 50,20 50,20 C50,20 70,10 80,20 C90,30 90,50 80,60 Z"
              />
            </View>
          </View>
        </Page>
      </Section>
    </Print>
  );
}

export default render;
