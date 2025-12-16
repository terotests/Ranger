# Ranger PDF Writer

A minimalistic PDF generator written in Ranger, demonstrating buffer-based binary output, JPEG embedding, and EXIF metadata parsing.

## Features

- **PDF 1.4 Generation** - Creates valid PDF files with text, shapes, and images
- **Buffer-Based Output** - Uses `GrowableBuffer` linked list for efficient binary output
- **JPEG Embedding** - Embeds JPEG images using DCTDecode (raw JPEG data)
- **EXIF Metadata Parsing** - Extracts camera info, dates, exposure settings, and GPS coordinates
- **Vector Graphics** - Draws shapes (rectangles, triangles, circles, hearts, stars, snowflakes)

## Files

| File | Description |
|------|-------------|
| `Buffer.rgr` | GrowableBuffer class with linked list of 4KB chunks |
| `JPEGReader.rgr` | Basic JPEG parser for dimensions and color info |
| `JPEGMetadata.rgr` | Full EXIF/JFIF/GPS metadata parser |
| `PDFWriter.rgr` | Main PDF generator with shapes, text, and images |

## Usage

### Compile and Run

```bash
# From project root
npm run pdf

# Or separately:
npm run pdf:compile
npm run pdf:run
```

### Run JPEG Metadata Parser Standalone

```bash
npm run jpegmeta
```

## Output Files

- `hello_world.pdf` - Basic PDF with shapes and text
- `hello_with_image.pdf` - PDF with Example.jpg embedded
- `canon_with_metadata.pdf` - PDF with Canon_40D.jpg and EXIF metadata displayed
- `gps_with_metadata.pdf` - PDF with GPS_test.jpg and GPS coordinates displayed

## Example Code

```ranger
Import "Buffer.rgr"
Import "JPEGReader.rgr"
Import "JPEGMetadata.rgr"

class Main {
    sfn m@(main):void () {
        def writer (new PDFWriter())
        
        ; Create simple PDF
        writer.savePDF("./output" "test.pdf" "Hello, World!")
        
        ; Create PDF with JPEG image and metadata
        writer.savePDFWithImage("./output" "with_image.pdf" "My Photo" "./images" "photo.jpg")
    }
}
```

## EXIF Metadata Displayed

When embedding a JPEG with EXIF data, the following metadata is shown:

- **Image Dimensions** - Width × Height
- **Camera Make/Model** - e.g., Canon EOS 40D
- **Date/Time Original** - When photo was taken
- **Exposure Settings** - Shutter speed, aperture (f/number), ISO
- **Focal Length** - Lens focal length in mm
- **Flash** - Fired or not fired
- **GPS Coordinates** - Latitude/Longitude in degrees, minutes, seconds format

## Technical Notes

### Buffer System

The `GrowableBuffer` uses a linked list of fixed-size chunks (4KB default) to avoid large reallocations:

```ranger
class BufferChunk {
    def data:buffer (buffer_alloc 0)
    def used:int 0
    def capacity:int 0
    def next@(optional):BufferChunk
}
```

### PDF Structure

Generated PDFs follow PDF 1.4 specification:
1. Header with binary marker
2. Object stream (Catalog, Pages, Page, Content, Font, optional Image XObject)
3. Cross-reference table
4. Trailer

### JPEG Embedding

JPEGs are embedded as raw binary data using `/Filter /DCTDecode`, which tells PDF readers to decode the JPEG directly. No re-encoding needed.

### GPS Coordinate Format

GPS coordinates are stored in EXIF as three RATIONAL values (degrees, minutes, seconds). The parser converts these to human-readable format:

```
43° 27' 52.43" N
11° 52' 55.43" E
```

## Test Images

- `Example.jpg` - Simple test image
- `Canon_40D.jpg` - Sample with Canon camera EXIF data
- `GPS_test.jpg` - Sample with GPS coordinates embedded
