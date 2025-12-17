// =============================================================================
// Sample EVG Document - TSX Format
// =============================================================================
// This file demonstrates how to create a PDF document using JSX syntax.
// The EVG layout engine calculates element positions, then renders to PDF.
//
// Usage: evg_pdf sample.tsx output.pdf

import { EVGStyle, PageSizes, Colors } from "./evg_types";

// =============================================================================
// Document Content
// =============================================================================

function render() {
  return (
    <page width={595} height={842}>
      {/* Main content wrapper with padding */}
      <box
        style={{
          padding: "40px",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Header Section */}
        <box
          style={{
            marginBottom: "30px",
            paddingBottom: "15px",
            borderBottom: "2px",
            borderColor: "#2563EB",
          }}
        >
          <text
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1F2937",
            }}
          >
            EVG Document Example
          </text>
          <text
            style={{
              fontSize: "12px",
              color: "#6B7280",
              marginTop: "8px",
            }}
          >
            Generated from TSX using EVG Layout Engine
          </text>
        </box>

        {/* Introduction */}
        <box style={{ marginBottom: "20px" }}>
          <text
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#374151",
            }}
          >
            This document demonstrates the integration of TypeScript JSX with
            the EVG layout engine and PDF renderer. The source file is written
            in TSX format, providing full IDE support with type checking and
            autocomplete.
          </text>
        </box>

        {/* Two Column Layout */}
        <row style={{ gap: "20px", marginBottom: "20px" }}>
          {/* Left Column */}
          <box
            style={{
              width: "50%",
              padding: "15px",
              backgroundColor: "#F3F4F6",
              borderRadius: "8px",
            }}
          >
            <text
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#1F2937",
                marginBottom: "10px",
              }}
            >
              Features
            </text>
            <text
              style={{ fontSize: "12px", color: "#4B5563", lineHeight: 1.5 }}
            >
              • TypeScript type definitions
            </text>
            <text
              style={{ fontSize: "12px", color: "#4B5563", lineHeight: 1.5 }}
            >
              • VSCode intellisense support
            </text>
            <text
              style={{ fontSize: "12px", color: "#4B5563", lineHeight: 1.5 }}
            >
              • Flexbox-like layout
            </text>
            <text
              style={{ fontSize: "12px", color: "#4B5563", lineHeight: 1.5 }}
            >
              • CSS-style properties
            </text>
            <text
              style={{ fontSize: "12px", color: "#4B5563", lineHeight: 1.5 }}
            >
              • PDF output generation
            </text>
          </box>

          {/* Right Column */}
          <box
            style={{
              width: "50%",
              padding: "15px",
              backgroundColor: "#EFF6FF",
              borderRadius: "8px",
            }}
          >
            <text
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#1E40AF",
                marginBottom: "10px",
              }}
            >
              Workflow
            </text>
            <text
              style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: 1.5 }}
            >
              1. Write TSX document
            </text>
            <text
              style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: 1.5 }}
            >
              2. Parse with ts_parser
            </text>
            <text
              style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: 1.5 }}
            >
              3. Convert JSX to EVG
            </text>
            <text
              style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: 1.5 }}
            >
              4. Calculate layout
            </text>
            <text
              style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: 1.5 }}
            >
              5. Render to PDF
            </text>
          </box>
        </row>

        {/* Info Box */}
        <box
          style={{
            padding: "15px",
            backgroundColor: "#FEF3C7",
            borderLeft: "4px",
            borderColor: "#F59E0B",
            marginBottom: "20px",
          }}
        >
          <text
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#92400E",
              marginBottom: "5px",
            }}
          >
            Note
          </text>
          <text style={{ fontSize: "12px", color: "#78350F", lineHeight: 1.5 }}>
            This is Phase 1 of the implementation. JavaScript expressions inside
            JSX are not yet evaluated - all values are treated as string
            literals.
          </text>
        </box>

        {/* Code Example */}
        <box style={{ marginBottom: "20px" }}>
          <text
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#1F2937",
              marginBottom: "10px",
            }}
          >
            Example Code
          </text>
          <box
            style={{
              padding: "12px",
              backgroundColor: "#1F2937",
              borderRadius: "6px",
            }}
          >
            <text
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#E5E7EB",
                lineHeight: 1.4,
              }}
            >
              &lt;page width={595} height={842}&gt;
            </text>
            <text
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#E5E7EB",
                lineHeight: 1.4,
              }}
            >
              &lt;box style={{ padding: "20px" }}&gt;
            </text>
            <text
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#E5E7EB",
                lineHeight: 1.4,
              }}
            >
              &lt;text&gt;Hello, PDF!&lt;/text&gt;
            </text>
            <text
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#E5E7EB",
                lineHeight: 1.4,
              }}
            >
              &lt;/box&gt;
            </text>
            <text
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#E5E7EB",
                lineHeight: 1.4,
              }}
            >
              &lt;/page&gt;
            </text>
          </box>
        </box>

        {/* Footer - positioned at bottom */}
        <box
          style={{
            position: "absolute",
            bottom: "40px",
            left: "40px",
            right: "40px",
          }}
        >
          <divider style={{ marginBottom: "10px" }} color="#E5E7EB" />
          <row style={{ justifyContent: "space-between" }}>
            <text style={{ fontSize: "10px", color: "#9CA3AF" }}>
              EVG Layout Engine + PDF Renderer
            </text>
            <text style={{ fontSize: "10px", color: "#9CA3AF" }}>Page 1</text>
          </row>
        </box>
      </box>
    </page>
  );
}

export default render;
