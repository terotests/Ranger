# JPEG Decoder/Encoder Implementation Plan

## Status: ✅ FULLY IMPLEMENTED

Both baseline and progressive JPEG decoder/encoder are fully implemented and working!

### Completed Features

- ✅ **Baseline JPEG Decoder** (JPEGDecoder.rgr)
- ✅ **Progressive JPEG Decoder** (ProgressiveJPEGDecoder.rgr)
- ✅ **JPEG Encoder** (JPEGEncoder.rgr)
- ✅ **EXIF Orientation Support** - Auto-rotates images based on EXIF data
- ✅ **Command-line Tool** (jpeg_scaler.rgr) - Scale images with width/height/scale modes
- ✅ **Multi-target Support** - Works in JavaScript and Go

### Quality Metrics

- Progressive JPEG decoding: RMSE 0.00583 (0.58% error vs reference decoder)
- Baseline JPEG: Pixel-perfect decoding

## Overview

Implement a baseline JPEG decoder in Ranger to convert JPEG files to raw RGB pixel data. Output will be saved as PPM format for easy verification.

## JPEG Decoding Pipeline

```
JPEG File → Parse Markers → Build Tables → Decode Entropy → Dequantize → IDCT → YCbCr→RGB → Pixels
```

## Phase 1: Marker Parsing ✅

Parse JPEG structure to extract:

- [x] SOI (FFD8) - Start of Image
- [x] SOF0 (FFC0) - Start of Frame (baseline DCT) - width, height, components
- [x] DQT (FFDB) - Define Quantization Table(s)
- [x] DHT (FFC4) - Define Huffman Table(s)
- [x] SOS (FFDA) - Start of Scan (entropy-coded data follows)
- [x] EOI (FFD9) - End of Image

### Data to Extract

```
SOF0:
  - Precision (8 bits)
  - Height, Width
  - Number of components (usually 3: Y, Cb, Cr)
  - For each component: ID, sampling factors, quantization table ID

DQT:
  - Table ID (0-3)
  - 64 quantization values (8x8)

DHT:
  - Table class (0=DC, 1=AC)
  - Table ID (0-3)
  - Symbol counts for each code length (1-16)
  - Symbol values

SOS:
  - Component selectors
  - DC/AC table selectors per component
  - Spectral selection (0-63 for baseline)
```

## Phase 2: Huffman Decoding

### 2.1 Build Huffman Tables

From DHT marker data, build lookup structures:

```ranger
class HuffmanTable {
    def bits:[int]       ; Count of codes at each length (16)
    def values:[int]     ; Symbol values
    def codes:[int]      ; Actual Huffman codes
    def lengths:[int]    ; Code lengths for each symbol
}
```

### 2.2 Bit Stream Reader

Read bits from entropy-coded data:

```ranger
class BitReader {
    def data:buffer
    def pos:int          ; Byte position
    def bitPos:int       ; Bit position within byte (0-7)

    fn readBits:int (count:int)
    fn peekBits:int (count:int)
}
```

Handle byte stuffing: `FF 00` in data stream = literal `FF`

### 2.3 Decode Process

For each 8x8 block:

1. Decode DC coefficient (difference from previous block)
2. Decode 63 AC coefficients using run-length encoding
3. Result: 64 quantized DCT coefficients in zigzag order

## Phase 3: Dequantization

Multiply decoded coefficients by quantization table values:

```
dequantized[i] = decoded[i] * quantTable[i]
```

## Phase 4: Inverse DCT (IDCT)

Transform 8x8 frequency-domain block to spatial-domain pixels.

### IDCT Formula (simplified)

For each pixel (x, y) in 8x8 block:

```
pixel[x][y] = sum over u,v of:
    C(u) * C(v) * S[u][v] * cos((2x+1)*u*π/16) * cos((2y+1)*v*π/16)
```

Where C(0) = 1/√2, C(n) = 1 for n > 0

### Integer IDCT Approximation

Use scaled integer arithmetic to avoid floating point:

- Pre-compute cosine table (scaled by 4096)
- Use bit shifts for division

## Phase 5: Color Space Conversion

Convert YCbCr to RGB:

```
R = Y + 1.402 * (Cr - 128)
G = Y - 0.344 * (Cb - 128) - 0.714 * (Cr - 128)
B = Y + 1.772 * (Cb - 128)
```

Integer approximation (scaled by 256):

```
R = Y + ((359 * (Cr - 128)) >> 8)
G = Y - ((88 * (Cb - 128)) >> 8) - ((183 * (Cr - 128)) >> 8)
B = Y + ((454 * (Cb - 128)) >> 8)
```

## Phase 6: MCU Assembly

### Sampling Factors

Common configurations:

- 4:4:4 - Each component same size (1x1 sampling)
- 4:2:2 - Cb/Cr half width (2x1 Y, 1x1 Cb/Cr)
- 4:2:0 - Cb/Cr quarter size (2x2 Y, 1x1 Cb/Cr)

### MCU Structure

For 4:2:0 (most common):

- MCU = 16x16 pixels
- 4 Y blocks (8x8 each), 1 Cb block, 1 Cr block
- Upsample Cb/Cr to match Y size

## File Structure

```
gallery/pdf_writer/
  JPEGDecoder.rgr           ; Baseline JPEG decoder ✅
  ProgressiveJPEGDecoder.rgr ; Progressive JPEG decoder ✅
  JPEGEncoder.rgr           ; JPEG encoder ✅
  HuffmanDecoder.rgr        ; Huffman table building & decoding ✅
  DCT.rgr                   ; IDCT/FDCT implementation ✅
  BitReader.rgr             ; Bit-level stream reading ✅
  ImageBuffer.rgr           ; Raw pixel buffer with scaling ✅
  PPMImage.rgr              ; PPM input/output ✅
  jpeg_scaler.rgr           ; CLI tool for scaling JPEGs ✅
  jpeg_encoder_test.rgr     ; Encode/decode round-trip test ✅
```

## Implementation Order

### Step 1: BitReader ✅

- Read bits from buffer
- Handle FF00 byte stuffing
- Track position

### Step 2: Marker Parser Enhancement ✅

- Parse DQT (quantization tables)
- Parse DHT (Huffman tables)
- Parse SOS (scan header)
- Locate entropy-coded data

### Step 3: Huffman Decoder ✅

- Build code tables from DHT data
- Decode symbol from bit stream

### Step 4: Block Decoder ✅

- Decode DC coefficient
- Decode AC coefficients (run-length)
- Convert zigzag to 8x8 matrix

### Step 5: IDCT ✅

- Integer IDCT implementation
- Pre-computed cosine tables

### Step 6: Color Conversion & Output ✅

- YCbCr to RGB
- Handle different sampling factors
- Assemble final image

## Testing Strategy

1. **Parse test**: ✅ Verify all markers parsed correctly
2. **Huffman test**: ✅ Decode known bit patterns
3. **Single block**: ✅ Decode one 8x8 block, verify values
4. **Grayscale**: ✅ Decode grayscale JPEG (simpler, Y only)
5. **Color 4:4:4**: ✅ Full color, no subsampling
6. **Color 4:2:0**: ✅ Standard JPEG with subsampling
7. **Progressive JPEG**: ✅ Multi-scan progressive decoding
8. **Round-trip test**: ✅ Encode then decode, compare RMSE

## Limitations (Initial Version)

- ~~Baseline JPEG only (SOF0)~~ ✅ Now supports Progressive (SOF2)
- No arithmetic coding
- ~~No EXIF orientation correction~~ ✅ EXIF orientation supported
- No restart markers (DRI/RST)

## Additional Features Implemented

### JPEG Encoder (JPEGEncoder.rgr)

- Standard Huffman tables (not optimized)
- Quality setting (1-100)
- Generates valid baseline JPEG files
- Proper marker structure (SOI, DQT, SOF0, DHT, SOS, EOI)

### Progressive JPEG Decoder (ProgressiveJPEGDecoder.rgr)

- DC first/refine scans
- AC first/refine scans
- Spectral selection (Ss, Se)
- Successive approximation (Ah, Al)
- Multi-component scans
- EOBRUN handling for AC coefficients

### JPEG Scaler CLI (jpeg_scaler.rgr)

```
Usage:
  jpeg_scaler -width <pixels> input.jpg output.jpg
  jpeg_scaler -height <pixels> input.jpg output.jpg
  jpeg_scaler -scale <factor> input.jpg output.jpg

Options:
  -quality <1-100>  JPEG quality (default: 85)
```

- Auto-detects progressive vs baseline JPEG
- Bilinear-like scaling algorithm
- Works in both JavaScript (Node.js) and Go

## Reference

- JPEG Standard: ITU-T T.81
- Useful resource: https://www.w3.org/Graphics/JPEG/itu-t81.pdf

## Zigzag Order

```
 0  1  5  6 14 15 27 28
 2  4  7 13 16 26 29 42
 3  8 12 17 25 30 41 43
 9 11 18 24 31 40 44 53
10 19 23 32 39 45 52 54
20 22 33 38 46 51 55 60
21 34 37 47 50 56 59 61
35 36 48 49 57 58 62 63
```

Index array for zigzag to row-major:

```
0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,41,34,27,20,13,6,7,14,21,28,35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63
```
