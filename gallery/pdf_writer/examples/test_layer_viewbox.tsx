// Test file for Layer element and imageViewBox feature
// Layer: Absolute positioned overlay that fills parent
// imageViewBox: Crop/zoom into specific region of an image

import { View, Label, Image, Layer } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="20px" backgroundColor="#f0f0f0">
      {/* Title */}
      <Label fontSize="28px" fontWeight="bold" color="#2c3e50">
        Layer and Image ViewBox Test
      </Label>

      {/* Section 1: Image with Centered Text Overlay */}
      <Label fontSize="18px" fontWeight="bold" color="#34495e" marginTop="30px">
        Image with Centered Text Overlay
      </Label>

      <View flexDirection="row" gap="20px" marginTop="15px">
        {/* Image with centered text layer */}
        <View
          width="300px"
          height="200px"
          borderRadius="12px"
          position="relative"
        >
          <Image
            src="../assets/images/Canon_40D.jpg"
            width="100%"
            height="100%"
            objectFit="cover"
            borderRadius="12px"
          />
          <Layer
            background="linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6))"
            flexDirection="row"
            align="center"
            verticalAlign="center"
          >
            <Label
              fontSize="24px"
              fontWeight="bold"
              color="#ffffff"
              textAlign="center"
            >
              Centered Title
            </Label>
          </Layer>
        </View>

        {/* Image with bottom text overlay */}
        <View
          width="300px"
          height="200px"
          borderRadius="12px"
          position="relative"
        >
          <Image
            src="../assets/images/Canon_40D.jpg"
            width="100%"
            height="100%"
            objectFit="cover"
            borderRadius="12px"
          />
          <Layer
            background="linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))"
            flexDirection="row"
            align="center"
            verticalAlign="bottom"
            padding="20px"
          >
            <View>
              <Label
                fontSize="20px"
                fontWeight="bold"
                color="#ffffff"
                textAlign="center"
              >
                Photo Caption
              </Label>
              <Label
                fontSize="12px"
                color="rgba(255,255,255,0.8)"
                textAlign="center"
                marginTop="4px"
              >
                Description below
              </Label>
            </View>
          </Layer>
        </View>
      </View>

      {/* Section 2: Layer Element Cards */}
      <Label fontSize="18px" fontWeight="bold" color="#34495e" marginTop="40px">
        Layer Element Cards
      </Label>

      <View flexDirection="row" gap="20px" marginTop="15px">
        {/* Card with gradient overlay layer */}
        <View
          width="200px"
          height="150px"
          borderRadius="12px"
          backgroundColor="#3498db"
          position="relative"
        >
          <Label fontSize="16px" color="#ffffff" padding="15px">
            Card with Layer
          </Label>
          
          <Layer background="linear-gradient(180deg, transparent, rgba(0,0,0,0.5))">
            <Label
              position="absolute"
              bottom="10px"
              left="15px"
              fontSize="12px"
              color="#ffffff"
            >
              Bottom overlay text
            </Label>
          </Layer>
        </View>

        {/* Card with multiple layers */}
        <View
          width="200px"
          height="150px"
          borderRadius="12px"
          backgroundColor="#9b59b6"
          position="relative"
        >
          <Label fontSize="16px" color="#ffffff" padding="15px">
            Multi-Layer Card
          </Label>
          
          <Layer backgroundColor="rgba(255,255,255,0.1)" />
          <Layer background="linear-gradient(45deg, transparent, rgba(255,255,255,0.2))" />
        </View>
      </View>

      {/* Section 2: Image ViewBox */}
      <Label fontSize="18px" fontWeight="bold" color="#34495e" marginTop="40px">
        Image ViewBox (Crop/Zoom)
      </Label>

      <View flexDirection="row" gap="20px" marginTop="15px">
        {/* Original image */}
        <View flexDirection="column" gap="5px">
          <Label fontSize="12px" color="#666">
            Original (full image)
          </Label>
          <Image
            src="../assets/images/Canon_40D.jpg"
            width="150px"
            height="100px"
            borderRadius="8px"
            objectFit="cover"
          />
        </View>

        {/* Cropped - top left region */}
        <View flexDirection="column" gap="5px">
          <Label fontSize="12px" color="#666">
            Top-left crop (0% 0% 50% 50%)
          </Label>
          <Image
            src="../assets/images/Canon_40D.jpg"
            imageViewBox="0% 0% 50% 50%"
            width="150px"
            height="100px"
            borderRadius="8px"
            objectFit="cover"
          />
        </View>

        {/* Cropped - center region */}
        <View flexDirection="column" gap="5px">
          <Label fontSize="12px" color="#666">
            Center crop (25% 25% 50% 50%)
          </Label>
          <Image
            src="../assets/images/Canon_40D.jpg"
            imageViewBox="25% 25% 50% 50%"
            width="150px"
            height="100px"
            borderRadius="8px"
            objectFit="cover"
          />
        </View>
      </View>

      {/* Section 3: Object Fit options */}
      <Label fontSize="18px" fontWeight="bold" color="#34495e" marginTop="40px">
        Object Fit Options
      </Label>

      <View flexDirection="row" gap="20px" marginTop="15px">
        {/* Cover */}
        <View flexDirection="column" gap="5px">
          <Label fontSize="12px" color="#666">object-fit: cover</Label>
          <Image
            src="../assets/images/Canon_40D.jpg"
            objectFit="cover"
            width="120px"
            height="120px"
            borderRadius="8px"
            backgroundColor="#ddd"
          />
        </View>

        {/* Contain */}
        <View flexDirection="column" gap="5px">
          <Label fontSize="12px" color="#666">object-fit: contain</Label>
          <Image
            src="../assets/images/Canon_40D.jpg"
            objectFit="contain"
            width="120px"
            height="120px"
            borderRadius="8px"
            backgroundColor="#ddd"
          />
        </View>

        {/* Fill */}
        <View flexDirection="column" gap="5px">
          <Label fontSize="12px" color="#666">object-fit: fill</Label>
          <Image
            src="../assets/images/Canon_40D.jpg"
            objectFit="fill"
            width="120px"
            height="120px"
            borderRadius="8px"
            backgroundColor="#ddd"
          />
        </View>
      </View>

      {/* Section 4: Combined - Layer over image */}
      <Label fontSize="18px" fontWeight="bold" color="#34495e" marginTop="40px">
        Combined: Image with Layer Overlay
      </Label>

      <View flexDirection="row" gap="20px" marginTop="15px">
        {/* Image with gradient overlay */}
        <View
          width="250px"
          height="180px"
          borderRadius="12px"
          position="relative"
        >
          <Image
            src="../assets/images/Canon_40D.jpg"
            width="100%"
            height="100%"
            objectFit="cover"
          />
          <Layer background="linear-gradient(180deg, transparent, rgba(0,0,0,0.7))">
            <View position="absolute" bottom="15px" left="15px">
              <Label fontSize="18px" fontWeight="bold" color="#ffffff">
                Photo Title
              </Label>
              <Label fontSize="12px" color="rgba(255,255,255,0.8)" marginTop="4px">
                Description text here
              </Label>
            </View>
          </Layer>
        </View>

        {/* Cropped image with layer */}
        <View
          width="250px"
          height="180px"
          borderRadius="12px"
          position="relative"
        >
          <Image
            src="../assets/images/Canon_40D.jpg"
            imageViewBox="20% 20% 60% 60%"
            width="100%"
            height="100%"
            objectFit="cover"
          />
          <Layer background="linear-gradient(135deg, rgba(52,152,219,0.5), rgba(155,89,182,0.5))">
            <Label
              position="absolute"
              top="50%"
              left="50%"
              fontSize="20px"
              fontWeight="bold"
              color="#ffffff"
            >
              Centered Text
            </Label>
          </Layer>
        </View>
      </View>
    </View>
  );
}

export default render;
