import { View, Label, Image } from "./evg_types";

function render() {
  return (
    <View width="100%" height="100%" padding="30px">
      <Label fontSize="28px" fontWeight="bold" color="#2c3e50">
        Image Test
      </Label>
      <Label fontSize="14px" color="#7f8c8d" marginTop="8px">
        Testing JPEG image embedding in PDF
      </Label>

      <View flexDirection="row" marginTop="30px">
        {/* Image on the left */}
        <Image src="./bin/IMG_6573.jpg" width="250px" height="200px" />

        {/* Text on the right */}
        <View flex="1" marginLeft="20px">
          <Label fontSize="18px" fontWeight="bold" color="#34495e">
            About This Image
          </Label>
          <Label
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            This is a test of embedding JPEG images directly into PDF documents.
            The image on the left is loaded from the bin folder and embedded
            using DCTDecode (native JPEG compression in PDF).
          </Label>
          <Label
            fontSize="14px"
            color="#555555"
            marginTop="10px"
            lineHeight="1.6"
          >
            The EVG layout engine calculates the position and size of the image,
            and the PDF renderer embeds it as an XObject that can be rendered at
            any position on the page.
          </Label>
        </View>
      </View>

      <View marginTop="40px">
        <Label fontSize="12px" color="#999999" textAlign="center">
          EVG PDF Tool - JPEG Image Embedding Demo
        </Label>
      </View>
    </View>
  );
}
