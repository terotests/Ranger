# EVG-Aware Video Encoder Plan

## Overview

An MP4 video encoder that leverages EVG animation data to **skip motion estimation entirely** - the hardest part of video encoding. Since EVG controls the animation, we already know where elements move!

## Key Innovation

### Traditional Video vs EVG-Aware

| Aspect            | Traditional H.264          | EVG-Aware Encoder              |
| ----------------- | -------------------------- | ------------------------------ |
| Motion estimation | Expensive search algorithm | **Known from animation data**  |
| Block matching    | 16x16, 8x8, 4x4 search     | **Exact object positions**     |
| Reference frames  | Generic I/P/B frames       | **Keyframes at scene changes** |
| Complexity        | ⭐⭐⭐⭐⭐ (8-10 weeks)    | ⭐⭐⭐ (3-4 weeks)             |

### How It Works

```
Frame 1 (EVG state):
  - Box A at (100, 100) size 200x200
  - Text "Hello" at (150, 150)

Frame 2 (EVG state):
  - Box A at (120, 100) size 200x200  ← moved +20px X
  - Text "Hello" at (170, 150)        ← moved +20px X

Motion Vector: (20, 0) for both elements - WE ALREADY KNOW THIS!
```

### Expected Compression Benefits

For typical EVG animations:

- **60-80%** of pixels unchanged → SKIP blocks (0 bytes!)
- **15-30%** just moved → MOTION blocks (tiny - just vectors)
- **5-10%** new content → INTRA blocks (encode like JPEG)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  EVG Animation Timeline                  │
│  Frame 1 → Frame 2 → Frame 3 → ... → Frame N            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              EVG Delta Calculator                        │
│  - Compare element positions between frames              │
│  - Extract motion vectors directly from EVG data         │
│  - Identify unchanged regions (skip encoding)            │
│  - Detect new/removed elements (I-block regions)         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Smart Frame Encoder                         │
│  - I-frames: Full JPEG at keyframes/scene changes        │
│  - P-frames: Only encode changed regions + motion        │
│  - Skip blocks: Unchanged pixels = 0 bytes               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              MP4 Container                               │
│  - ftyp, moov, mdat atoms                               │
│  - Sample tables, timestamps                             │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
gallery/evg_video/
├── PLAN_EVG_VIDEO.md        # This file
├── EVGKeyframe.rgr          # Animation state at a point in time
├── EVGTimeline.rgr          # Keyframe management and interpolation
├── EVGDelta.rgr             # Frame differencing (the key insight!)
├── BlockEncoder.rgr         # DCT + Quantization (reuse from JPEG)
├── FrameEncoder.rgr         # I-frame and P-frame encoding
├── MP4Box.rgr               # MP4 container atom structure
├── MP4Muxer.rgr             # Combine frames into MP4 file
└── evg_video_tool.rgr       # CLI tool
```

## Implementation Phases

### Phase 1: EVG Animation Model (Week 1)

#### EVGKeyframe.rgr

```ranger
class EVGKeyframe {
    def time:double 0.0           ; Time in seconds
    def elements:[EVGElement]      ; Element states at this time

    fn getElement:EVGElement (id:string)
    fn clone:EVGKeyframe ()
}
```

#### EVGTimeline.rgr

```ranger
class EVGTimeline {
    def keyframes:[EVGKeyframe]
    def duration:double 0.0
    def frameRate:int 30

    fn addKeyframe:void (keyframe:EVGKeyframe)
    fn getFrameAt:EVGKeyframe (time:double)
    fn interpolate:EVGElement (elem:EVGElement t0:double t1:double t:double)
    fn getTotalFrames:int ()
}
```

### Phase 2: Delta Calculation (Week 1-2)

This is where the magic happens - we extract motion vectors directly from EVG data!

#### EVGDelta.rgr

```ranger
class EVGElementDelta {
    def elementId:string ""
    def motionX:double 0.0        ; Known motion vector X
    def motionY:double 0.0        ; Known motion vector Y
    def scaleChange:double 0.0    ; Scale difference
    def rotationChange:double 0.0 ; Rotation difference
    def opacityChange:double 0.0  ; Opacity difference
    def colorChange:boolean false ; Color changed?
    def isNew:boolean false       ; Element appeared (requires I-block)
    def isRemoved:boolean false   ; Element disappeared (can skip)
    def isUnchanged:boolean false ; No change at all (skip entirely!)
    def boundingBox:Rect          ; Affected screen region
}

class EVGFrameDelta {
    def deltas:[EVGElementDelta]
    def changedRegions:[Rect]     ; Only encode these areas
    def unchangedRegions:[Rect]   ; Skip these (huge savings!)
    def motionVectors:[MotionVector]

    sfn calculate:EVGFrameDelta (prev:EVGKeyframe next:EVGKeyframe)
    fn getBlockType:int (blockX:int blockY:int)  ; SKIP, MOTION, or INTRA
}

class MotionVector {
    def blockX:int 0      ; Block position
    def blockY:int 0
    def deltaX:int 0      ; Motion in pixels
    def deltaY:int 0
    def hasResidual:boolean false  ; Need to encode difference?
}
```

### Phase 3: Block Encoding (Week 2)

Reuse JPEG DCT code for encoding pixel blocks.

#### Block Types

```ranger
; Block classification based on EVG deltas
BLOCK_SKIP   = 0   ; Unchanged - 0 bytes!
BLOCK_MOTION = 1   ; Copy from reference + motion vector
BLOCK_INTRA  = 2   ; New content - full DCT encode
```

#### BlockEncoder.rgr

```ranger
class BlockEncoder {
    def quality:int 85
    def dct:DCT
    def quantTable:[int]

    fn encodeIntraBlock:buffer (pixels:buffer x:int y:int)
    fn encodeMotionBlock:buffer (mv:MotionVector residual:buffer)
    fn encodeSkipRun:buffer (count:int)  ; Run-length encode skips

    ; Reuse from JPEG
    fn forwardDCT:void (block:[int] output:[int])
    fn quantize:void (block:[int] table:[int])
}
```

### Phase 4: Frame Encoding (Week 3)

#### FrameEncoder.rgr

```ranger
class EVGFrameEncoder {
    def timeline:EVGTimeline
    def width:int 0
    def height:int 0
    def quality:int 85
    def blockSize:int 16          ; 16x16 macroblocks
    def blocksPerRow:int 0
    def blocksPerCol:int 0

    def blockEncoder:BlockEncoder
    def prevFrame:ImageBuffer     ; Reference frame

    fn encodeIFrame:buffer (frame:EVGKeyframe)
    fn encodePFrame:buffer (frame:EVGKeyframe prev:EVGKeyframe delta:EVGFrameDelta)

    fn classifyBlocks:[int] (delta:EVGFrameDelta)
    fn renderFrame:ImageBuffer (frame:EVGKeyframe)
    fn encodeFrame:buffer (frameNum:int)
}
```

### Phase 5: MP4 Container (Week 3-4)

#### MP4Box.rgr

```ranger
class MP4Box {
    def boxType:string ""     ; "ftyp", "moov", "mdat", etc.
    def boxSize:int 0
    def data:buffer
    def children:[MP4Box]

    fn addChild:void (child:MP4Box)
    fn toBuffer:buffer ()
    fn calculateSize:int ()
}

; Box type constants
; "ftyp" - File type
; "moov" - Movie header (metadata)
;   "mvhd" - Movie header
;   "trak" - Track
;     "tkhd" - Track header
;     "mdia" - Media
;       "mdhd" - Media header
;       "hdlr" - Handler
;       "minf" - Media info
;         "stbl" - Sample table
;           "stsd" - Sample description
;           "stts" - Time to sample
;           "stsc" - Sample to chunk
;           "stsz" - Sample sizes
;           "stco" - Chunk offsets
; "mdat" - Media data (actual frames)
```

#### MP4Muxer.rgr

```ranger
class MP4Muxer {
    def frames:[buffer]           ; Encoded frame data
    def frameSizes:[int]          ; Size of each frame
    def frameTypes:[int]          ; I=1, P=2
    def frameRate:int 30
    def width:int 0
    def height:int 0
    def duration:double 0.0

    fn addFrame:void (data:buffer isKeyframe:boolean)
    fn createFtyp:MP4Box ()
    fn createMoov:MP4Box ()
    fn createMdat:MP4Box ()
    fn mux:buffer ()
    fn save:void (dirPath:string fileName:string)
}
```

### Phase 6: CLI Tool (Week 4)

#### evg_video_tool.rgr

```ranger
class EVGVideoTool {
    sfn m@(main):void () {
        ; Parse arguments
        ; evg_video -fps 30 -quality 85 animation.evg output.mp4
    }

    fn encodeAnimation:void (evgFile:string outputFile:string fps:int quality:int)
    fn previewFrame:void (evgFile:string frameNum:int outputJpg:string)
    fn analyzeAnimation:void (evgFile:string)  ; Show frame deltas, motion stats
}
```

## Optimization Opportunities

### 1. Static Background Detection

If EVG has a static background layer, encode it ONCE in I-frame,
then skip ALL background blocks in P-frames.

### 2. Text Optimization

Text elements that just move can use motion vectors with NO residual.
The text pixels are identical, just repositioned.

### 3. Shape Caching

For repeated shapes (icons, buttons), cache the DCT coefficients
and reuse them with different positions.

### 4. Predictable Transitions

Fade-in/out, slide animations have mathematically predictable
pixel values - can encode as parameters instead of pixels.

### 5. Layer-Based Encoding

EVG has layer information - encode each layer separately,
composite during playback for even better compression.

## Example: Slide Presentation

```
Slide 1 (I-frame): Full encode - 100KB
  - Title: "Introduction"
  - Background: Blue gradient
  - Logo: Company logo

Slide 1→2 transition (P-frames):
  - Background: SKIP (unchanged) - 0 bytes!
  - Title: MOTION (slides out left) - ~50 bytes (just vector)
  - New title: INTRA (slides in from right) - ~5KB (small region)
  - Logo: SKIP (unchanged) - 0 bytes!

Result: Instead of encoding 1920x1080 = 2M pixels,
only encode ~200x50 = 10K pixel region for title change!
P-frame size: ~6KB instead of ~100KB = 94% reduction!
```

## Comparison with Standard Approaches

### File Size Estimates (30 sec animation, 1080p, 30fps)

| Approach       | File Size    | Notes                        |
| -------------- | ------------ | ---------------------------- |
| Raw frames     | 5.5 GB       | Uncompressed                 |
| Motion JPEG    | 150 MB       | No inter-frame               |
| Standard H.264 | 15 MB        | Full motion estimation       |
| **EVG-Aware**  | **10-20 MB** | Similar quality, 10x simpler |

### Encoding Speed

| Approach       | Speed          | Notes                        |
| -------------- | -------------- | ---------------------------- |
| Standard H.264 | 10-30 fps      | Motion estimation bottleneck |
| **EVG-Aware**  | **60-120 fps** | Skip motion estimation!      |

## Dependencies

- `gallery/evg/*` - Layout engine (already implemented)
- `gallery/pdf_writer/DCT.rgr` - DCT transform (reuse)
- `gallery/pdf_writer/JPEGEncoder.rgr` - Quantization tables (reuse)
- `gallery/pdf_writer/Buffer.rgr` - Buffer handling (reuse)

## Timeline

| Week | Phase            | Deliverables                       |
| ---- | ---------------- | ---------------------------------- |
| 1    | Animation Model  | EVGKeyframe.rgr, EVGTimeline.rgr   |
| 2    | Delta Calculator | EVGDelta.rgr (key innovation!)     |
| 3    | Frame Encoding   | BlockEncoder.rgr, FrameEncoder.rgr |
| 4    | MP4 Container    | MP4Box.rgr, MP4Muxer.rgr, CLI tool |

## Future Enhancements

1. **Audio support** - Sync audio track with animation
2. **Streaming** - Fragmented MP4 for web streaming
3. **Hardware acceleration** - GPU-based rendering
4. **Alternative codecs** - AV1, VP9 containers
5. **Real-time preview** - Encode while editing EVG
