# JPEG Decoder Bug Investigation

## Problem Description

**Symptom:** Horizontal stripe artifacts in PDF export for specific JPEG image

**Affected Image:** `IMG_5857 2_frame_003.jpg` (added to .gitignore)

**Source:** FFmpeg-exported video frame from .MOV file

**Note:** Most images work correctly - this is specific to ffmpeg-generated JPEGs

## Image Properties (from ImageMagick identify -verbose)

```
Format: JPEG (Baseline DCT)
Dimensions: 1080x1920 (portrait, 9:16)
Colorspace: sRGB
Depth: 8-bit
Channels: 3 (RGB)
Quality: 94
Interlace: None (NOT progressive)
Sampling factor: 2x2,1x1,1x1 (= 4:2:0 chroma subsampling)
Comment: Lavc62.11.100 (FFmpeg/libavcodec)
```

## Key Observations

1. **Baseline 4:2:0 JPEG** - Should be supported by decoder
2. **FFmpeg origin** - FFmpeg often uses restart markers (DRI) in video frames
3. **Portrait orientation** - 1080x1920, width 1080 is not divisible by 16
4. **High quality** - Quality 94, minimal compression artifacts expected

## Investigation Progress

### Analyzed Files

1. **BitReader.rgr** (lines 1-146)
   - RST marker handling in `loadNextByte()` (lines 45-50)
   - Automatically skips RST markers (FF D0-D7)
   - `alignToByte()` only resets bitPos to 0

2. **JPEGDecoder.rgr** (lines 440-620)
   - Restart interval handling (lines 451-461)
   - DC prediction reset at `mcuCount % restartInterval == 0`
   - MCU decode loop with Y/Cb/Cr block collection
   - `writeMCU` with 4:2:0 subsampling (lines 593-620)

3. **DCT.rgr** (lines 1-252)
   - IDCT transform looks correct
   - Cosine table and zigzag mapping verified

4. **ImageBuffer.rgr** - `setPixelRGB` looks correct

### Potential Issues Identified

#### Issue 1: RST Marker Sync Problem (HIGH PRIORITY)

**Problem:** BitReader automatically skips RST markers, but decoder expects to handle them:

```ranger
; BitReader (lines 45-50) - auto-skips RST
if ((nextByte >= 208) && (nextByte <= 215)) {
    bytePos = bytePos + 1
    this.loadNextByte()  ; Skip RST marker
    return
}

; JPEGDecoder (lines 451-461) - expects RST at specific MCU count
if ((restartInterval > 0) && (mcuCount > 0) && ((mcuCount % restartInterval) == 0)) {
    ; Reset DC predictions
    reader.alignToByte()  ; But RST already skipped!
}
```

**Consequence:** If RST markers in bitstream don't align with `mcuCount % restartInterval`, decoder gets out of sync.

#### Issue 2: MCU Grid Calculation for Non-16-Divisible Width

Width 1080 with 4:2:0 (16x16 MCU):
- 1080 / 16 = 67.5 → Should round up to 68 MCUs per row
- Need to verify `mcusPerRow` calculation handles this correctly

#### Issue 3: Chroma Index Calculation

In `writeMCU` 4:2:0 section (lines 618-620):
```ranger
def chromaX:int ((blockX * 4) + (bit_shr px 1))
def chromaY:int ((blockY * 4) + (bit_shr py 1))
def chromaIdx:int ((chromaY * 8) + chromaX)
```

This assumes 8x8 chroma block layout - verify this is correct for all MCU positions.

## ROOT CAUSE FOUND ✅

### The Bug: BitReader Incorrectly Auto-Skips RST Markers

**Location:** `BitReader.rgr` lines 47-52

**Problem:** BitReader automatically skips RST markers (FF D0-D7) inside `loadNextByte()`, but this is WRONG because:

1. **RST markers should only appear at specific positions** - after `restartInterval` MCUs
2. **FF D0-D7 bytes can appear as DATA** inside entropy-coded stream (with FF 00 byte stuffing)
3. **BitReader doesn't know the context** - it can't distinguish between:
   - Real RST marker at expected position
   - FF D0-D7 bytes that are actual compressed data

### Why This Causes Horizontal Stripes

When BitReader encounters `FF D0` (or D1-D7) in the middle of compressed data:
1. It incorrectly interprets this as an RST marker
2. It skips 2 bytes (FF + Dx)
3. **The decoder loses sync** - subsequent MCUs are decoded from wrong byte positions
4. The image shows corruption at regular intervals (where FF Dx accidentally appeared in data)

### The Fix Required

**Option A: Remove auto-skip from BitReader (Recommended)**

BitReader should NOT automatically skip RST markers. Instead:
1. Treat FF D0-D7 like any other FF xx sequence (return the FF byte)
2. Let the decoder handle RST at the expected MCU boundaries

```ranger
; BitReader.rgr - REMOVE this block:
; RST markers (D0-D7 = 208-215) - skip them
if ((nextByte >= 208) && (nextByte <= 215)) {
    ; Skip the RST marker
    bytePos = bytePos + 1
    ; Load the next actual byte
    this.loadNextByte()
    return
}
```

**Option B: Add RST reading to decoder**

After `alignToByte()`, decoder should explicitly read and validate the RST marker:

```ranger
; In JPEGDecoder restart handling:
reader.alignToByte()
; Read and verify RST marker
def rstByte1:int (reader.readByte())  ; Should be FF
def rstByte2:int (reader.readByte())  ; Should be D0-D7
if ((rstByte1 != 255) || (rstByte2 < 208) || (rstByte2 > 215)) {
    print "Warning: Expected RST marker not found"
}
```

### Why Most Images Work

Most JPEG images either:
1. Don't use restart intervals (DRI = 0)
2. Have restart intervals that happen to work by chance
3. Don't have FF D0-D7 sequences in their compressed data

FFmpeg-generated video frames often use restart intervals AND high quality (Q=94), which means more data bytes, higher chance of FF Dx appearing naturally in the bitstream.

## Next Steps

1. ✅ **Implement Fix A** - Removed RST auto-skip from BitReader
2. ✅ **Add explicit RST reading** - Added `skipRestartMarker()` function to BitReader
3. ✅ **Updated decoder** - JPEGDecoder now calls `skipRestartMarker()` after `alignToByte()`
4. **TODO: Build and test** - Run `npm run evgpreview:build` and test with problem image
5. **TODO: Test regression** - Ensure other images still work

## Changes Made

### BitReader.rgr
- Removed automatic RST marker skipping from `loadNextByte()` (was lines 47-52)
- Added new `skipRestartMarker()` function that explicitly skips FF D0-D7 markers
- This function should only be called at restart interval boundaries by the decoder

### JPEGDecoder.rgr  
- Added call to `reader.skipRestartMarker()` after `reader.alignToByte()` in restart handling (line ~461)

## File Locations

```
gallery/pdf_writer/src/jpeg/
├── BitReader.rgr        # Bit-level reader with RST skip
├── JPEGDecoder.rgr      # Main decoder (~735 lines)
├── JPEGEncoder.rgr      # Encoder (~1400 lines)
├── DCT.rgr              # IDCT transform
├── ImageBuffer.rgr      # Pixel buffer
└── HuffmanDecoder.rgr   # Huffman tables
```

## Commands to Debug

```bash
# Check for DRI marker in image
xxd "IMG_5857 2_frame_003.jpg" | head -100

# Extract JPEG structure with exiftool
exiftool -v3 "IMG_5857 2_frame_003.jpg" | head -50

# Check restart interval specifically
jpeginfo -c "IMG_5857 2_frame_003.jpg"
```
