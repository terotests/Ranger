// test_gallery.tsx - Photo Album Gallery Test
// Tests various photo layout components for a printed photo book

import { Print, Section, Page, View, Label, Image } from "./evg_types";
import {
  FullPagePhoto,
  FullPagePhotoWithCaption,
  FourPhotoGrid,
  TwoPhotoHorizontal,
  TwoPhotoVertical,
  PhotoCaptionBelow,
  PhotoCaptionOverlay,
  PhotoCaptionRight,
  PhotoCaptionLeft,
  ThreePhotoFeatureLeft,
  ThreePhotoFeatureRight,
  TitlePage,
  TitlePageWithPhoto,
} from "../components/PhotoLayouts";

// Sample photo - using the test image
const samplePhoto = "../assets/images/IMG_6573.jpg";

function render() {
  return (
    <Print
      title="Photo Album Gallery Test"
      author="EVG Demo"
      imageQuality="85"
      maxImageSize="1200"
    >
      <Section pageWidth="595" pageHeight="842" margin="0">
        {/* Page 1: Title Page */}
        <Page>
          <TitlePage
            title="Summer Memories"
            subtitle="2024"
            backgroundColor="#34495e"
          />
        </Page>

        {/* Page 2: Title Page with Photo Background */}
        <Page>
          <TitlePageWithPhoto
            title="Our Adventures"
            subtitle="A Year in Photos"
            backgroundSrc={samplePhoto}
            overlayColor="rgba(0,0,0,0.5)"
          />
        </Page>

        {/* Page 3: Full Page Photo - No borders */}
        <Page>
          <FullPagePhoto src={samplePhoto} />
        </Page>

        {/* Page 4: Full Page Photo with Caption Overlay */}
        <Page>
          <FullPagePhotoWithCaption
            src={samplePhoto}
            caption="A beautiful sunset at the beach"
          />
        </Page>

        {/* Page 5: Four Photo Grid with Light Blue Background */}
        <Page>
          <FourPhotoGrid
            src1={samplePhoto}
            src2={samplePhoto}
            src3={samplePhoto}
            src4={samplePhoto}
            backgroundColor="#e8f4f8"
            gap="15px"
            padding="30px"
          />
        </Page>

        {/* Page 6: Four Photo Grid - White Background */}
        <Page>
          <FourPhotoGrid
            src1={samplePhoto}
            src2={samplePhoto}
            src3={samplePhoto}
            src4={samplePhoto}
            backgroundColor="#f5f5f5"
          />
        </Page>

        {/* Page 7: Two Photos Horizontal - No background */}
        <Page>
          <TwoPhotoHorizontal
            src1={samplePhoto}
            src2={samplePhoto}
            backgroundColor="#ffffff"
            padding="50px"
          />
        </Page>

        {/* Page 8: Two Photos Vertical */}
        <Page>
          <TwoPhotoVertical
            src1={samplePhoto}
            src2={samplePhoto}
            backgroundColor="#ffffff"
            padding="40px"
          />
        </Page>

        {/* Page 9: Photo with Caption Below */}
        <Page>
          <PhotoCaptionBelow
            src={samplePhoto}
            caption="The golden hour light made everything magical that evening. We spent hours just watching the waves."
            captionFontSize="14px"
            captionColor="#555555"
          />
        </Page>

        {/* Page 10: Photo with Caption Overlay */}
        <Page>
          <PhotoCaptionOverlay
            src={samplePhoto}
            caption="Memories of Summer 2024"
            overlayColor="rgba(0,0,0,0.6)"
            captionColor="#ffffff"
          />
        </Page>

        {/* Page 11: Photo with Caption on Right */}
        <Page>
          <PhotoCaptionRight
            src={samplePhoto}
            title="Beach Day"
            caption="We finally made it to the coast after months of planning. The weather was perfect and the kids had a blast building sandcastles."
            accentColor="#2980b9"
          />
        </Page>

        {/* Page 12: Photo with Caption on Left */}
        <Page>
          <PhotoCaptionLeft
            src={samplePhoto}
            title="Golden Hour"
            caption="There's something magical about the light just before sunset. Everything seems to glow with warmth and possibility."
            accentColor="#e67e22"
          />
        </Page>

        {/* Page 13: Three Photo Feature - Large on Left */}
        <Page>
          <ThreePhotoFeatureLeft
            src1={samplePhoto}
            src2={samplePhoto}
            src3={samplePhoto}
            backgroundColor="#fafafa"
          />
        </Page>

        {/* Page 14: Three Photo Feature - Large on Right */}
        <Page>
          <ThreePhotoFeatureRight
            src1={samplePhoto}
            src2={samplePhoto}
            src3={samplePhoto}
            backgroundColor="#f0f0f0"
          />
        </Page>

        {/* Page 15: Custom Layout - Mixed elements */}
        <Page>
          <View
            width="100%"
            height="100%"
            backgroundColor="#ffffff"
            padding="40px"
          >
            <Label
              fontSize="24px"
              fontWeight="bold"
              color="#2c3e50"
              marginBottom="20px"
            >
              Summer Collection
            </Label>
            <View flexDirection="row" width="100%" height="70%">
              <View width="65%" height="100%" marginRight="5%">
                <Image
                  src={samplePhoto}
                  width="100%"
                  height="100%"
                  borderRadius="5px"
                />
              </View>
              <View width="30%" height="100%">
                <View width="100%" height="48%" marginBottom="4%">
                  <Image
                    src={samplePhoto}
                    width="100%"
                    height="100%"
                    borderRadius="5px"
                  />
                </View>
                <View width="100%" height="48%">
                  <Image
                    src={samplePhoto}
                    width="100%"
                    height="100%"
                    borderRadius="5px"
                  />
                </View>
              </View>
            </View>
            <Label
              fontSize="12px"
              color="#7f8c8d"
              marginTop="20px"
              textAlign="center"
            >
              The best moments are the ones we share together
            </Label>
          </View>
        </Page>

        {/* Page 16: Polaroid Style Grid */}
        <Page>
          <View
            width="100%"
            height="100%"
            backgroundColor="#e8e0d5"
            padding="40px"
          >
            <View
              flexDirection="row"
              width="100%"
              height="45%"
              marginBottom="5%"
            >
              <View
                width="45%"
                height="100%"
                backgroundColor="#ffffff"
                padding="10px"
                marginRight="10%"
              >
                <Image src={samplePhoto} width="100%" height="80%" />
                <Label
                  fontSize="11px"
                  fontFamily="Gloria Hallelujah"
                  color="#333333"
                  marginTop="8px"
                  textAlign="center"
                >
                  Beach day!
                </Label>
              </View>
              <View
                width="45%"
                height="100%"
                backgroundColor="#ffffff"
                padding="10px"
              >
                <Image src={samplePhoto} width="100%" height="80%" />
                <Label
                  fontSize="11px"
                  fontFamily="Gloria Hallelujah"
                  color="#333333"
                  marginTop="8px"
                  textAlign="center"
                >
                  Fun times
                </Label>
              </View>
            </View>
            <View flexDirection="row" width="100%" height="45%">
              <View
                width="45%"
                height="100%"
                backgroundColor="#ffffff"
                padding="10px"
                marginRight="10%"
              >
                <Image src={samplePhoto} width="100%" height="80%" />
                <Label
                  fontSize="11px"
                  fontFamily="Gloria Hallelujah"
                  color="#333333"
                  marginTop="8px"
                  textAlign="center"
                >
                  Sunset
                </Label>
              </View>
              <View
                width="45%"
                height="100%"
                backgroundColor="#ffffff"
                padding="10px"
              >
                <Image src={samplePhoto} width="100%" height="80%" />
                <Label
                  fontSize="11px"
                  fontFamily="Gloria Hallelujah"
                  color="#333333"
                  marginTop="8px"
                  textAlign="center"
                >
                  Memories
                </Label>
              </View>
            </View>
          </View>
        </Page>
      </Section>
    </Print>
  );
}

export default render;
