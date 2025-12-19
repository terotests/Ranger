import { Print, Section, Page, View, Label, Image } from "./evg_types";

function render() {
  return (
    <Print title="SVG Path Test" author="EVG Demo">
      <Section pageWidth="595" pageHeight="842" margin="40px">
        {/* Page 1: Path Rendering */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="28px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="25px"
            >
              SVG Path Rendering
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Simple Shapes:
            </Label>

            {/* Star */}
            <View flexDirection="row" marginBottom="20px">
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="10px"
                marginRight="20px"
              >
                <Path
                  d="M25,10 L30,20 L40,22 L32,30 L35,40 L25,35 L15,40 L18,30 L10,22 L20,20 Z"
                  width="60px"
                  height="60px"
                  fill="#f39c12"
                />
              </View>

              {/* Circle */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="10px"
                marginRight="20px"
              >
                <Path
                  d="M50,25 C50,11.2 38.8,0 25,0 S0,11.2 0,25 S11.2,50 25,50 S50,38.8 50,25 Z"
                  width="60px"
                  height="60px"
                  fill="#3498db"
                />
              </View>

              {/* Heart */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="10px"
              >
                <Path
                  d="M25,45 L10,30 C5,25 5,15 10,10 C15,5 25,10 25,10 C25,10 35,5 40,10 C45,15 45,25 40,30 Z"
                  width="60px"
                  height="60px"
                  fill="#e74c3c"
                />
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginTop="20px"
              marginBottom="15px"
            >
              Icon Paths:
            </Label>

            <View flexDirection="row" marginBottom="20px">
              {/* Camera Icon */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="15px"
                marginRight="20px"
              >
                <Path
                  d="M10,6.5c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S12.2,6.5,10,6.5M10,13.9c-1.8,0-3.2-1.5-3.2-3.2S8.2,7.4,10,7.4c1.8,0,3.2,1.5,3.2,3.2S11.8,13.9,10,13.9M17.1,5.7l-3.2,0L12.5,3.7c-0.1-0.1-0.2-0.2-0.3-0.2H7.8c-0.1,0-0.3,0.1-0.3,0.2L6.1,5.7H2.9c-1,0-1.7,0.7-1.7,1.7v7.4c0,1,0.8,1.7,1.7,1.7h14.2c1,0,1.7-0.8,1.7-1.7V7.2C18.8,6.2,18.1,5.7,17.1,5.7"
                  width="50px"
                  height="50px"
                  viewBox="0 0 20 20"
                  fill="#34495e"
                />
              </View>

              {/* Home Icon */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="15px"
                marginRight="20px"
              >
                <Path
                  d="M18.5,9 L10,0.5 L1.5,9 L3,9 L3,18 L8,18 L8,12 L12,12 L12,18 L17,18 L17,9 Z"
                  width="50px"
                  height="50px"
                  fill="#2ecc71"
                />
              </View>

              {/* Settings Icon */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="15px"
              >
                <Path
                  d="M17,10 L15.5,8.5 L15.5,6 L13,6 L11.5,4.5 L9,4.5 L7.5,6 L5,6 L5,8.5 L3.5,10 L5,11.5 L5,14 L7.5,14 L9,15.5 L11.5,14 L13,14 L15.5,11.5 Z M10,13 C8.3,13 7,11.7 7,10 C7,8.3 8.3,7 10,7 C11.7,7 13,8.3 13,10 C13,11.7 11.7,13 10,13 Z"
                  width="50px"
                  height="50px"
                  fill="#9b59b6"
                />
              </View>
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginTop="20px"
              marginBottom="15px"
            >
              Stroked Paths:
            </Label>

            <View flexDirection="row">
              {/* Square outline */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="10px"
                marginRight="20px"
              >
                <Path
                  d="M10,10 L50,10 L50,50 L10,50 Z"
                  width="60px"
                  height="60px"
                  stroke="#e74c3c"
                  strokeWidth={3}
                />
              </View>

              {/* Triangle outline */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="10px"
                marginRight="20px"
              >
                <Path
                  d="M30,5 L55,50 L5,50 Z"
                  width="60px"
                  height="60px"
                  stroke="#3498db"
                  strokeWidth={2}
                />
              </View>

              {/* Diamond filled and stroked */}
              <View
                width="80px"
                height="80px"
                backgroundColor="#f0f0f0"
                padding="10px"
              >
                <Path
                  d="M30,5 L55,30 L30,55 L5,30 Z"
                  width="60px"
                  height="60px"
                  fill="#f39c12"
                  stroke="#c0392b"
                  strokeWidth={2}
                />
              </View>
            </View>
          </View>
        </Page>

        {/* Page 2: Clip Path */}
        <Page>
          <View width="100%" height="100%" backgroundColor="#ffffff">
            <Label
              fontSize="28px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="25px"
            >
              SVG Clip Path
            </Label>

            <Label fontSize="14px" color="#7f8c8d" marginBottom="30px">
              Clip paths allow you to mask content to specific shapes
            </Label>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Image Clipped to Circle:
            </Label>

            {/* Circle clip */}
            <View
              width="100px"
              height="100px"
              marginBottom="30px"
              clipPath="M100,50 C100,77.6 77.6,100 50,100 C22.4,100 0,77.6 0,50 C0,22.4 22.4,0 50,0 C77.6,0 100,22.4 100,50 Z"
            >
              <Image src="./bin/IMG_6573.jpg" width="100%" height="100%" />
            </View>

            <View width="100px" height="100px" marginBottom="30px">
              <Image src="./bin/IMG_6573.jpg" width="100%" height="100%" />
            </View>

            <View
              width="200px"
              height="200px"
              marginBottom="30px"
              clipPath="M100,50 C100,77.6 77.6,100 50,100 C22.4,100 0,77.6 0,50 C0,22.4 22.4,0 50,0 C77.6,0 100,22.4 100,50 Z"
            >
              <Image src="./bin/IMG_6573.jpg" width="200px" height="200px" />
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              Image Clipped to Star:
            </Label>

            {/* Star clip */}
            <View
              width="200px"
              height="200px"
              marginBottom="30px"
              clipPath="M100,20 L120,80 L180,92 L132,140 L145,200 L100,165 L55,200 L68,140 L20,92 L80,80 Z"
            >
              <Image src="./bin/IMG_6573.jpg" width="200px" height="200px" />
            </View>

            <Label
              fontSize="16px"
              fontWeight="bold"
              color="#34495e"
              marginBottom="15px"
            >
              View with Background Clipped to Heart:
            </Label>

            {/* Heart clip with gradient-like colors */}
            <View flexDirection="row">
              <View
                width="100px"
                height="100px"
                marginRight="20px"
                backgroundColor="#e74c3c"
                clipPath="M50,90 L20,60 C10,50 10,30 20,20 C30,10 50,20 50,20 C50,20 70,10 80,20 C90,30 90,50 80,60 Z"
              />

              <View
                width="100px"
                height="100px"
                marginRight="20px"
                backgroundColor="#3498db"
                clipPath="M50,90 L20,60 C10,50 10,30 20,20 C30,10 50,20 50,20 C50,20 70,10 80,20 C90,30 90,50 80,60 Z"
              />

              <View
                width="100px"
                height="100px"
                backgroundColor="#f39c12"
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
