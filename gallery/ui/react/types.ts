/**
 * React-compatible primitive props shared by DOM host and Ranger→EVG host.
 * Attribute names match EVG / JSXToEVG camelCase (fontSize, backgroundColor, …).
 */

export type Unit = string;

export interface StyleProps {
  width?: Unit;
  height?: Unit;
  minWidth?: Unit;
  maxWidth?: Unit;
  minHeight?: Unit;
  maxHeight?: Unit;
  margin?: Unit;
  marginTop?: Unit;
  marginRight?: Unit;
  marginBottom?: Unit;
  marginLeft?: Unit;
  padding?: Unit;
  paddingTop?: Unit;
  paddingRight?: Unit;
  paddingBottom?: Unit;
  paddingLeft?: Unit;
  border?: Unit;
  borderColor?: string;
  borderRadius?: Unit;
  display?: "block" | "flex" | "inline";
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: Unit;
  flex?: number | string;
  position?: "relative" | "absolute";
  top?: Unit;
  left?: Unit;
  right?: Unit;
  bottom?: Unit;
  backgroundColor?: string;
  color?: string;
  opacity?: number | string;
  fontSize?: Unit;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number | string;
  role?: string;
}

export interface ViewProps extends StyleProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: unknown) => void;
}

export interface TextProps extends StyleProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends StyleProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: unknown) => void;
  disabled?: boolean;
}

export interface ImageProps extends StyleProps {
  id?: string;
  className?: string;
  src: string;
  alt?: string;
}
