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
}

// =============================================================================
// EVG Element Props
// =============================================================================

export interface EVGBaseProps {
  id?: string;
  style?: EVGStyle;
  className?: string;
}

export interface EVGPageProps {
  /** Page width in points (1 point = 1/72 inch). A4 = 595 */
  width: number;
  /** Page height in points (1 point = 1/72 inch). A4 = 842 */
  height: number;
  style?: EVGStyle;
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
      /** Document page - the root container with fixed dimensions */
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

// View props - main container element with inline style support
export interface EVGViewProps {
  id?: string;
  className?: string;
  children?: any;

  // Dimensions
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;

  // Box Model - Margin
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Box Model - Padding
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;

  // Border
  borderWidth?: string;
  borderColor?: string;
  borderRadius?: string;

  // Layout - Flexbox
  flexDirection?: "row" | "column";
  flex?: string | number;
  justifyContent?: "start" | "center" | "end" | "space-between";
  alignItems?: "start" | "center" | "end" | "stretch";
  gap?: string;

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
  width?: string;
  height?: string;

  // Box Model
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  padding?: string;

  // Text styling
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | string;
  fontStyle?: "normal" | "italic";
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: string | number;
  letterSpacing?: string;

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

export const View = (props: EVGViewProps): any => null;
export const Label = (props: EVGTextProps): any => null;
export const Image = (props: EVGImageProps): any => null;

export default {};
