// =============================================================================
// EVG Type Definitions for TSX/JSX
// =============================================================================
// These type definitions provide VSCode intellisense for EVG elements.
// Import this file in your TSX document for autocomplete and type checking.

// Unit type - supports px, %, em, hp (height percent), fill
export type Unit =
  | `${number}px`
  | `${number}%`
  | `${number}em`
  | `${number}hp`
  | "fill"
  | number;

// Color type - supports hex, rgb, rgba, hsl, and named colors
export type Color = string;

// =============================================================================
// EVG Style Interface
// =============================================================================

export interface EVGStyle {
  // Dimensions
  width?: Unit;
  height?: Unit;
  minWidth?: Unit;
  maxWidth?: Unit;
  minHeight?: Unit;
  maxHeight?: Unit;

  // Box Model - Margin
  margin?: Unit;
  marginTop?: Unit;
  marginRight?: Unit;
  marginBottom?: Unit;
  marginLeft?: Unit;

  // Box Model - Padding
  padding?: Unit;
  paddingTop?: Unit;
  paddingRight?: Unit;
  paddingBottom?: Unit;
  paddingLeft?: Unit;

  // Border
  border?: Unit;
  borderWidth?: Unit;
  borderColor?: Color;
  borderRadius?: Unit;
  borderTop?: Unit;
  borderRight?: Unit;
  borderBottom?: Unit;
  borderLeft?: Unit;

  // Layout - Display
  display?: "block" | "flex" | "inline" | "none";

  // Layout - Flexbox
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  justifyContent?:
    | "start"
    | "center"
    | "end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  alignItems?: "start" | "center" | "end" | "stretch" | "baseline";
  alignContent?:
    | "start"
    | "center"
    | "end"
    | "stretch"
    | "space-between"
    | "space-around";
  gap?: Unit;
  rowGap?: Unit;
  columnGap?: Unit;
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: Unit;
  alignSelf?: "auto" | "start" | "center" | "end" | "stretch" | "baseline";

  // Layout - Position
  position?: "relative" | "absolute" | "fixed";
  top?: Unit;
  left?: Unit;
  right?: Unit;
  bottom?: Unit;
  zIndex?: number;

  // Visual - Background
  backgroundColor?: Color;
  backgroundImage?: string;
  backgroundSize?: "cover" | "contain" | Unit;
  backgroundPosition?: string;

  // Visual - Colors
  color?: Color;
  opacity?: number;

  // Visual - Overflow
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  overflowX?: "visible" | "hidden" | "scroll" | "auto";
  overflowY?: "visible" | "hidden" | "scroll" | "auto";

  // Text
  fontSize?: Unit;
  fontFamily?: string;
  fontWeight?:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
  fontStyle?: "normal" | "italic" | "oblique";
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: "none" | "underline" | "line-through" | "overline";
  lineHeight?: number | Unit;
  letterSpacing?: Unit;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  whiteSpace?: "normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line";

  // Transform
  transform?: string;
  rotate?: number;
  scale?: number;
  translateX?: Unit;
  translateY?: Unit;

  // SVG Path / Clipping
  /** SVG path data for clipping this element */
  clipPath?: string;
}

// =============================================================================
// EVG Element Props
// =============================================================================

export interface EVGBaseProps {
  id?: string;
  style?: EVGStyle;
  className?: string;
  /** SVG path for clipping */
  clipPath?: string;
}

export interface EVGBoxProps extends EVGBaseProps {
  children?: any;
}

export interface EVGTextProps extends EVGBaseProps {
  children?: string | number;
}

export interface EVGImageProps extends EVGBaseProps {
  /** Path to image file (JPEG supported) */
  src: string;
  /** Alternative text for accessibility */
  alt?: string;

  width?: Unit;
  height?: Unit;
}

export interface EVGPathProps extends EVGBaseProps {
  /** SVG path data (M, L, C, Q, Z commands) */
  d?: string;
  /** SVG path data (alternate name) */
  svgPath?: string;
  /** ViewBox for scaling (minX minY width height) */
  viewBox?: string;
  /** Fill color */
  fill?: Color;
  /** Stroke color */
  stroke?: Color;
  /** Stroke width */
  strokeWidth?: number;

  width?: Unit;
  height?: Unit;
}

export interface EVGRowProps extends EVGBaseProps {
  children?: any;
}

export interface EVGColumnProps extends EVGBaseProps {
  children?: any;
}

export interface EVGSpacerProps {
  /** Fixed size spacer */
  size?: Unit;
  /** Flexible spacer that takes remaining space */
  flex?: number;
}

export interface EVGDividerProps extends EVGBaseProps {
  /** Orientation of the divider */
  orientation?: "horizontal" | "vertical";
  /** Thickness of the divider line */
  thickness?: Unit;
  /** Color of the divider */
  color?: Color;
}

// =============================================================================
// JSX Intrinsic Elements Declaration
// =============================================================================
// These elements map to what JSXToEVG.rgr parser supports

declare global {
  namespace JSX {
    interface IntrinsicElements {
      /** Print document - top-level container for multi-page documents */
      Print: EVGPrintProps;
      /** Section - groups pages with shared settings (margins, headers, footers) */
      Section: EVGSectionProps;
      /** Page - a single page in the document */
      Page: EVGPageProps;
      /** Document page - the root container with fixed dimensions (legacy) */
      page: EVGPageProps;
      /** Generic container element (like div) */
      View: EVGViewProps;
      /** Text content element */
      Label: EVGTextProps;
      /** Text content element (lowercase alias) */
      label: EVGTextProps;
      /** Text content element (alias) */
      text: EVGTextProps;
      /** Image element - supports JPEG */
      Image: EVGImageProps;
      /** Image element (lowercase alias) */
      image: EVGImageProps;
      /** SVG Path element - renders vector shapes */
      Path: EVGPathProps;
      /** SVG Path element (lowercase alias) */
      path: EVGPathProps;
      /** Generic box container */
      box: EVGBoxProps;
      /** Horizontal flex container (shorthand for box with flexDirection: row) */
      row: EVGRowProps;
      /** Vertical flex container (shorthand for box with flexDirection: column) */
      column: EVGColumnProps;
      /** Spacer element for adding gaps */
      spacer: EVGSpacerProps;
      /** Divider line */
      divider: EVGDividerProps;
    }
  }
}

// =============================================================================
// Print Document Props
// =============================================================================

/**
 * Book/document format presets based on Blurb standard sizes.
 * Dimensions are in points (1 inch = 72 points).
 */
export type BookFormat =
  // Standard paper sizes
  | "a4"                    // 595×842 pts (8.27×11.69") - ISO A4
  | "letter"                // 612×792 pts (8.5×11") - US Letter
  // Trade book sizes (common for novels and non-fiction)
  | "trade-5x8"             // 360×576 pts (5×8")
  | "trade-6x9"             // 432×648 pts (6×9")
  | "trade-8x10"            // 576×720 pts (8×10")
  // Square formats (great for photo books)
  | "mini-square"           // 360×360 pts (5×5" / 13×13cm)
  | "small-square"          // 504×504 pts (7×7" / 18×18cm)
  | "large-square"          // 864×864 pts (12×12" / 30×30cm)
  // Standard photo book sizes
  | "standard-portrait"     // 576×720 pts (8×10")
  | "standard-landscape"    // 720×576 pts (10×8")
  // Large format
  | "large-landscape"       // 936×720 pts (13×10")
  // Magazine
  | "magazine";             // 612×792 pts (8.5×11")

/** Page orientation */
export type PageOrientation = "portrait" | "landscape";

/** Print document properties - top-level container */
export interface EVGPrintProps {
  children?: any;
  /** Document title for metadata */
  title?: string;
  /** Document author for metadata */
  author?: string;
  /** 
   * Book format preset - defines page dimensions.
   * Choose from standard paper sizes, trade book sizes, square formats, or photo book sizes.
   * @default "a4"
   */
  format?: BookFormat;
  /**
   * Page orientation - portrait or landscape.
   * For square formats, orientation has no effect.
   * @default "portrait"
   */
  orientation?: PageOrientation;
  /** JPEG quality for embedded images (1-100) */
  imageQuality?: string;
  /** Maximum image dimension in pixels */
  maxImageSize?: string;
}

/** Section properties - groups pages with shared settings */
export interface EVGSectionProps {
  children?: any;
  /** Page width in points (default: 595 = A4) */
  pageWidth?: string;
  /** Page height in points (default: 842 = A4) */
  pageHeight?: string;
  /** Margin for all sides */
  margin?: string;
  /** Top margin */
  marginTop?: string;
  /** Right margin */
  marginRight?: string;
  /** Bottom margin */
  marginBottom?: string;
  /** Left margin */
  marginLeft?: string;
}

/** Page properties */
export interface EVGPageProps {
  children?: any;
  /** Page width in points (overrides section) */
  width?: string | number;
  /** Page height in points (overrides section) */
  height?: string | number;
  /** Padding for page content area */
  padding?: string | number;
  /** Background color */
  backgroundColor?: string;
}

// View props - main container element with inline style support
export interface EVGViewProps {
  id?: string;
  className?: string;
  children?: any;

  // Dimensions
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;

  // Box Model - Margin
  margin?: string | number;
  marginTop?: string | number;
  marginRight?: string | number;
  marginBottom?: string | number;
  marginLeft?: string | number;

  // Box Model - Padding
  padding?: string | number;
  paddingTop?: string | number;
  paddingRight?: string | number;
  paddingBottom?: string | number;
  paddingLeft?: string | number;

  // Border
  borderWidth?: string | number;
  borderColor?: string;
  borderRadius?: string | number;

  // Layout - Flexbox
  flexDirection?: "row" | "column";
  flex?: string | number;
  justifyContent?: "start" | "center" | "end" | "space-between";
  alignItems?: "start" | "center" | "end" | "stretch";
  gap?: string | number;

  // Visual
  backgroundColor?: string;
  opacity?: number;
}

// Text/span props
export interface EVGTextProps {
  id?: string;
  className?: string;
  children?: string | number;

  // Dimensions
  width?: string | number;
  height?: string | number;

  // Box Model
  margin?: string | number;
  marginTop?: string | number;
  marginRight?: string | number;
  marginBottom?: string | number;
  marginLeft?: string | number;
  padding?: string | number;

  // Text styling
  fontSize?: string | number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | string;
  fontStyle?: "normal" | "italic";
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: string | number;
  letterSpacing?: string | number;

  // Visual
  backgroundColor?: string;
  opacity?: number;
}

// =============================================================================
// Common Page Sizes (in points)
// =============================================================================

export const PageSizes = {
  A4: { width: 595, height: 842 },
  A4_LANDSCAPE: { width: 842, height: 595 },
  A3: { width: 842, height: 1191 },
  A5: { width: 420, height: 595 },
  LETTER: { width: 612, height: 792 },
  LETTER_LANDSCAPE: { width: 792, height: 612 },
  LEGAL: { width: 612, height: 1008 },
  TABLOID: { width: 792, height: 1224 },
} as const;

// =============================================================================
// Common Colors
// =============================================================================

export const Colors = {
  // Basic
  black: "#000000",
  white: "#FFFFFF",
  transparent: "transparent",

  // Grays
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Primary colors
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#EAB308",
  green: "#22C55E",
  blue: "#3B82F6",
  indigo: "#6366F1",
  purple: "#A855F7",
  pink: "#EC4899",
} as const;

// =============================================================================
// Component Exports for JSX usage
// =============================================================================
// These are placeholder functions that allow TypeScript to recognize the JSX elements.
// The actual rendering is done by the EVG parser, not React.

export const Print = (props: EVGPrintProps): any => null;
export const Section = (props: EVGSectionProps): any => null;
export const Page = (props: EVGPageProps): any => null;
export const View = (props: EVGViewProps): any => null;
export const Label = (props: EVGTextProps): any => null;
export const Image = (props: EVGImageProps): any => null;
export const Path = (props: EVGPathProps): any => null;

// =============================================================================
// Hooks - React-like hooks for accessing document context
// =============================================================================

/**
 * Print settings returned by usePrintSettings() hook.
 * Contains page dimensions, format, and margin information.
 */
export interface PrintSettings {
  /** Page format (e.g., "a4", "letter", "large-square") */
  format: string;
  /** Page width in pixels */
  width: number;
  /** Page height in pixels */
  height: number;
  /** Page orientation: "portrait" or "landscape" */
  orientation: "portrait" | "landscape";
  /** Total number of pages in the document */
  pageCount: number;
  /** Page margins */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Image metadata returned by useImage() hook.
 * Contains dimensions and EXIF data from JPEG images.
 */
export interface ImageMetadata {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Image creation date from EXIF (null if not available) */
  createdAt: string | null;
  /** Camera make and model from EXIF (null if not available) */
  camera: string | null;
  /** EXIF orientation value (1-8, 1 = normal) */
  orientation: number;
  /** GPS coordinates from EXIF (null if not available) */
  gps: { latitude: string; longitude: string; altitude?: string } | null;
  /** Color space (e.g., "RGB", "CMYK") */
  colorSpace: string;
  /** Bits per color component */
  bitsPerComponent: number;
}

/**
 * Hook to get current print/page settings.
 * Returns format, dimensions, orientation, and margins from the <Print> element.
 * 
 * @example
 * ```tsx
 * function render() {
 *   const settings = usePrintSettings();
 *   const isLandscape = settings.orientation === "landscape";
 *   const columnsCount = isLandscape ? 3 : 2;
 *   // ... use settings.width, settings.height, etc.
 * }
 * ```
 */
export declare function usePrintSettings(): PrintSettings;

/**
 * Hook to get metadata for an image file.
 * Returns dimensions and EXIF data (creation date, camera, GPS, etc.)
 * 
 * @param src - Path to the image file
 * @returns Image metadata including dimensions and EXIF data
 * 
 * @example
 * ```tsx
 * function PhotoInfo({ src }: { src: string }) {
 *   const img = useImage(src);
 *   return (
 *     <View>
 *       <Label>{img.width} × {img.height}</Label>
 *       {img.createdAt && <Label>📅 {img.createdAt}</Label>}
 *       {img.camera && <Label>📷 {img.camera}</Label>}
 *     </View>
 *   );
 * }
 * ```
 */
export declare function useImage(src: string): ImageMetadata;

export default {};
