// PhotoLayouts.tsx - Higher-Order Components for Photo Album Layouts
import { View, Label, Image } from "../evg_types";

// ============================================================================
// Type Definitions
// ============================================================================

interface PhotoProps {
  src: string;
  caption?: string;
}

interface CaptionStyle {
  fontSize?: string;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

// ============================================================================
// Full Page Layouts
// ============================================================================

/**
 * FullPagePhoto - Edge-to-edge photo with no borders
 */
interface FullPagePhotoProps {
  src: string;
  title?: string;
}

export function FullPagePhoto({ src, title }: FullPagePhotoProps) {
  return (
    <View width="100%" height="100%" padding="30px" backgroundColor="#f5f5f5">
      <Image src={src} width="100%" height="100%" />
      {title && <Label width="100%" textAlign="center">{title}</Label>}
    </View>
  );
}

/**
 * FullPagePhotoWithCaption - Full page photo with caption overlay at bottom
 */
interface FullPagePhotoCaptionProps {
  src: string;
  title: string;
  captionColor?: string;
  overlayColor?: string;
}

export function FullPagePhotoWithCaption({
  src,
  title,
  captionColor = "#ffffff",
  overlayColor = "rgba(0,0,0,0.4)",
}: FullPagePhotoCaptionProps) {
  return (
    <View width="100%" height="100%" padding="30px" backgroundColor="#f5f5f5">
      <Image 
        src={src} 
        width="100%"
        height="100%"
        clipPath="M50,10 Q90,10 90,50 Q90,90 50,90 Q10,90 10,50 Q10,10 50,10 Z"
      />
      {title && <Label width="100%" fontFamily="Noto Sans" textAlign="center">{title}</Label>}
    </View>
  );
}

// ============================================================================
// Four Photo Grid Layouts
// ============================================================================

/**
 * FourPhotoGrid - 2x2 grid of photos with background
 */
interface FourPhotoGridProps {
  src1: string;
  src2: string;
  src3: string;
  src4: string;
  backgroundColor?: string;
  gap?: string;
  padding?: string;
}

export function FourPhotoGrid({
  src1,
  src2,
  src3,
  src4,
  backgroundColor = "#e8f4f8",
  gap = "15px",
  padding = "30px",
}: FourPhotoGridProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding={padding}
    >
      <View flexDirection="row" width="100%" height="48%" marginBottom={gap}>
        <View width="48%" height="100%" marginRight="4%">
          <Image src={src1} width="100%" height="100%" borderRadius="3px" />
        </View>
        <View width="48%" height="100%">
          <Image src={src2} width="100%" height="100%" borderRadius="3px" />
        </View>
      </View>
      <View flexDirection="row" width="100%" height="48%">
        <View width="48%" height="100%" marginRight="4%">
          <Image src={src3} width="100%" height="100%" borderRadius="3px" />
        </View>
        <View width="48%" height="100%">
          <Image src={src4} width="100%" height="100%" borderRadius="3px" />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Two Photo Layouts
// ============================================================================

/**
 * TwoPhotoHorizontal - Two photos side by side
 */
interface TwoPhotoHorizontalProps {
  src1: string;
  src2: string;
  backgroundColor?: string;
  gap?: string;
  padding?: string;
}

export function TwoPhotoHorizontal({
  src1,
  src2,
  backgroundColor = "#ffffff",
  gap = "20px",
  padding = "40px",
}: TwoPhotoHorizontalProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding={padding}
    >
      <View
        flexDirection="row"
        width="100%"
        height="100%"
        align="center"
        verticalAlign="center"
      >
        <View width="47%" height="80%" marginRight="6%">
          <Image src={src1} width="100%" height="100%" />
        </View>
        <View width="47%" height="80%">
          <Image src={src2} width="100%" height="100%" />
        </View>
      </View>
    </View>
  );
}

/**
 * TwoPhotoVertical - Two photos stacked vertically
 */
interface TwoPhotoVerticalProps {
  src1: string;
  src2: string;
  backgroundColor?: string;
  gap?: string;
  padding?: string;
}

export function TwoPhotoVertical({
  src1,
  src2,
  backgroundColor = "#ffffff",
  gap = "20px",
  padding = "40px",
}: TwoPhotoVerticalProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding={padding}
    >
      <View width="100%" height="47%" marginBottom="6%">
        <Image src={src1} width="100%" height="100%" />
      </View>
      <View width="100%" height="47%">
        <Image src={src2} width="100%" height="100%" />
      </View>
    </View>
  );
}

// ============================================================================
// Single Photo with Caption Layouts
// ============================================================================

/**
 * PhotoCaptionBelow - Photo with caption underneath
 */
interface PhotoCaptionBelowProps {
  src: string;
  caption: string;
  backgroundColor?: string;
  captionFontSize?: string;
  captionColor?: string;
}

export function PhotoCaptionBelow({
  src,
  caption,
  backgroundColor = "#ffffff",
  captionFontSize = "14px",
  captionColor = "#333333",
}: PhotoCaptionBelowProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding="40px"
    >
      <View width="100%" height="85%">
        <Image src={src} width="100%" height="100%" />
      </View>
      <View width="100%" height="12%" marginTop="3%">
        <Label
          fontSize={captionFontSize}
          color={captionColor}
          textAlign="center"
        >
          {caption}
        </Label>
      </View>
    </View>
  );
}

/**
 * PhotoCaptionOverlay - Photo with caption overlaid at bottom
 */
interface PhotoCaptionOverlayProps {
  src: string;
  caption: string;
  captionPosition?: "top" | "bottom";
  overlayColor?: string;
  captionColor?: string;
}

export function PhotoCaptionOverlay({
  src,
  caption,
  captionPosition = "bottom",
  overlayColor = "rgba(0,0,0,0.5)",
  captionColor = "#ffffff",
}: PhotoCaptionOverlayProps) {
  return (
    <View width="100%" height="100%">
      <Image src={src} width="100%" height="100%" />
      <View width="100%" backgroundColor={overlayColor} padding="20px">
        <Label fontSize="16px" color={captionColor} textAlign="center">
          {caption}
        </Label>
      </View>
    </View>
  );
}

/**
 * PhotoCaptionRight - Photo on left, caption on right
 */
interface PhotoCaptionSideProps {
  src: string;
  caption: string;
  title?: string;
  backgroundColor?: string;
  accentColor?: string;
}

export function PhotoCaptionRight({
  src,
  caption,
  title = "",
  backgroundColor = "#ffffff",
  accentColor = "#2c3e50",
}: PhotoCaptionSideProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding="40px"
    >
      <View flexDirection="row" width="100%" height="100%">
        <View width="60%" height="100%">
          <Image src={src} width="100%" height="100%" />
        </View>
        <View width="35%" height="100%" marginLeft="5%" padding="20px">
          <Label
            fontSize="20px"
            fontWeight="bold"
            color={accentColor}
            marginBottom="15px"
          >
            {title}
          </Label>
          <Label fontSize="14px" color="#555555" textAlign="left">
            {caption}
          </Label>
        </View>
      </View>
    </View>
  );
}

/**
 * PhotoCaptionLeft - Caption on left, photo on right
 */
export function PhotoCaptionLeft({
  src,
  caption,
  title = "",
  backgroundColor = "#ffffff",
  accentColor = "#2c3e50",
}: PhotoCaptionSideProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding="40px"
    >
      <View flexDirection="row" width="100%" height="100%">
        <View width="35%" height="100%" padding="20px">
          <Label
            fontSize="20px"
            fontWeight="bold"
            color={accentColor}
            marginBottom="15px"
          >
            {title}
          </Label>
          <Label fontSize="14px" color="#555555" textAlign="left">
            {caption}
          </Label>
        </View>
        <View width="60%" height="100%" marginLeft="5%">
          <Image src={src} width="100%" height="100%" />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Three Photo Layouts
// ============================================================================

/**
 * ThreePhotoFeatureLeft - One large photo on left with two smaller ones on right
 */
interface ThreePhotoFeatureProps {
  src1: string;
  src2: string;
  src3: string;
  backgroundColor?: string;
}

export function ThreePhotoFeatureLeft({
  src1,
  src2,
  src3,
  backgroundColor = "#ffffff",
}: ThreePhotoFeatureProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding="30px"
    >
      <View flexDirection="row" width="100%" height="100%">
        <View width="60%" height="100%" marginRight="3%">
          <Image src={src1} width="100%" height="100%" />
        </View>
        <View width="37%" height="100%">
          <View width="100%" height="48%" marginBottom="4%">
            <Image src={src2} width="100%" height="100%" />
          </View>
          <View width="100%" height="48%">
            <Image src={src3} width="100%" height="100%" />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * ThreePhotoFeatureRight - Two small photos on left, one large on right
 */
export function ThreePhotoFeatureRight({
  src1,
  src2,
  src3,
  backgroundColor = "#ffffff",
}: ThreePhotoFeatureProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      padding="30px"
    >
      <View flexDirection="row" width="100%" height="100%">
        <View width="37%" height="100%" marginRight="3%">
          <View width="100%" height="48%" marginBottom="4%">
            <Image src={src2} width="100%" height="100%" />
          </View>
          <View width="100%" height="48%">
            <Image src={src3} width="100%" height="100%" />
          </View>
        </View>
        <View width="60%" height="100%">
          <Image src={src1} width="100%" height="100%" />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Title/Chapter Pages
// ============================================================================

/**
 * TitlePage - Album or chapter title page
 */
interface TitlePageProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
}

export function TitlePage({
  title,
  subtitle,
  backgroundColor = "#2c3e50",
  titleColor = "#ffffff",
  subtitleColor = "#bdc3c7",
}: TitlePageProps) {
  return (
    <View
      width="100%"
      height="100%"
      backgroundColor={backgroundColor}
      align="center"
      verticalAlign="center"
    >
      <Label
        fontSize="42px"
        fontWeight="bold"
        color={titleColor}
        textAlign="center"
      >
        {title}
      </Label>
      {subtitle && (
        <Label
          fontSize="18px"
          color={subtitleColor}
          textAlign="center"
          marginTop="20px"
        >
          {subtitle}
        </Label>
      )}
    </View>
  );
}

/**
 * TitlePageWithPhoto - Title page with background photo
 */
interface TitlePagePhotoProps {
  title: string;
  subtitle?: string;
  backgroundSrc: string;
  overlayColor?: string;
  titleColor?: string;
}

export function TitlePageWithPhoto({
  title,
  subtitle,
  backgroundSrc,
  overlayColor = "rgba(0,0,0,0.4)",
  titleColor = "#ffffff",
}: TitlePagePhotoProps) {
  return (
    <View width="100%" height="100%">
      <Image src={backgroundSrc} width="100%" height="100%" />
      <View
        width="100%"
        height="100%"
        backgroundColor={overlayColor}
        align="center"
        verticalAlign="center"
      >
        <Label
          fontSize="48px"
          fontWeight="bold"
          color={titleColor}
          textAlign="center"
        >
          {title}
        </Label>
        {subtitle && (
          <Label
            fontSize="20px"
            color={titleColor}
            textAlign="center"
            marginTop="20px"
          >
            {subtitle}
          </Label>
        )}
      </View>
    </View>
  );
}

export default {
  FullPagePhoto,
  FullPagePhotoWithCaption,
  FourPhotoGrid,
  TwoPhotoHorizontal,
  TwoPhotoVertical,
  PhotoCaptionBelow,
  PhotoCaptionOverlay,
  PhotoCaptionRight,
  PhotoCaptionLeft,
  ThreePhotoFeature,
  TitlePage,
  TitlePageWithPhoto,
};
