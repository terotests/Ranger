/**
 * DOM host primitives — real React maps View/Text/Button/Image to HTML.
 * Swap the import path to the Ranger-compiled runtime to target EVG instead.
 */

import React from "react";
import type { ViewProps, TextProps, ButtonProps, ImageProps, StyleProps } from "./types";

const STYLE_KEYS: (keyof StyleProps)[] = [
  "width",
  "height",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "border",
  "borderColor",
  "borderRadius",
  "display",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "gap",
  "flex",
  "position",
  "top",
  "left",
  "right",
  "bottom",
  "backgroundColor",
  "color",
  "opacity",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "textAlign",
  "lineHeight",
];

function pickStyle(props: StyleProps): React.CSSProperties {
  const style: Record<string, string | number> = {};
  for (const key of STYLE_KEYS) {
    const v = props[key];
    if (v !== undefined && v !== null) {
      style[key] = v as string | number;
    }
  }
  return style as React.CSSProperties;
}

export function View(props: ViewProps): React.ReactElement {
  const { id, className, children, onClick, role, ...rest } = props;
  return React.createElement(
    "div",
    { id, className, role, style: pickStyle(rest), onClick },
    children,
  );
}

export function Text(props: TextProps): React.ReactElement {
  const { id, className, children, ...rest } = props;
  return React.createElement("span", { id, className, style: pickStyle(rest) }, children);
}

export function Button(props: ButtonProps): React.ReactElement {
  const { id, className, children, onClick, disabled, ...rest } = props;
  const style = pickStyle(rest);
  if (!style.padding) style.padding = "8px 14px";
  if (!style.backgroundColor) style.backgroundColor = "#2563eb";
  if (!style.color) style.color = "#ffffff";
  if (!style.borderRadius) style.borderRadius = "6px";
  if (!style.border) style.border = "none";
  if (!style.cursor) (style as React.CSSProperties).cursor = disabled ? "default" : "pointer";
  return React.createElement(
    "button",
    { id, className, type: "button", disabled, style, onClick },
    children,
  );
}

export function Image(props: ImageProps): React.ReactElement {
  const { id, className, src, alt, ...rest } = props;
  return React.createElement("img", {
    id,
    className,
    src,
    alt: alt ?? "",
    style: pickStyle(rest),
  });
}

export { createElement, Fragment, useState, useReducer } from "react";
