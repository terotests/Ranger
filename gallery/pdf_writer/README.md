# Ranger PDF Writer & JPEG Decoder

A collection of binary format utilities written in Ranger:

- **PDF Writer** - Generate PDFs with shapes, text, and embedded JPEGs
- **JPEG Decoder** - Full baseline DCT JPEG decoder with Huffman decoding

## Usage

### PDF Writer

```bash
# From project root
npm run pdf
```

This compiles and runs PDFWriter.rgr, generating sample PDFs in this directory.

### JPEG Metadata Parser

```bash
npm run jpegmeta
```

### JPEG Decoder

```bash
npm run jpegdec
```

Decodes `Canon_40D.jpg` and outputs `decoded_output.ppm`.

## Output Files

**PDF Files:**

- `hello_world.pdf` - Basic PDF with shapes and text
- `hello_with_image.pdf` - PDF with Example.jpg
- `canon_with_metadata.pdf` - PDF with Canon_40D.jpg and EXIF data
- `gps_with_metadata.pdf` - PDF with GPS_test.jpg and GPS coordinates

**Decoded Images:**

- `decoded_output.ppm` - Decoded JPEG in PPM format

## Files

### PDF Writer

| File               | Description                                   |
| ------------------ | --------------------------------------------- |
| `Buffer.rgr`       | GrowableBuffer with linked list of 4KB chunks |
| `JPEGReader.rgr`   | JPEG parser for dimensions                    |
| `JPEGMetadata.rgr` | EXIF/JFIF/GPS metadata parser                 |
| `PDFWriter.rgr`    | PDF generator                                 |

### JPEG Decoder

| File                 | Description                                    |
| -------------------- | ---------------------------------------------- |
| `JPEGDecoder.rgr`    | Main JPEG decoder (marker parsing, MCU decode) |
| `BitReader.rgr`      | Bit-level stream reader for entropy decoding   |
| `HuffmanDecoder.rgr` | Huffman table building and symbol decoding     |
| `DCT.rgr`            | 8x8 IDCT (Inverse Discrete Cosine Transform)   |
| `ImageBuffer.rgr`    | RGB image buffer with component assembly       |
| `PPMImage.rgr`       | PPM (Portable Pixmap) file writer              |

## Examples

### PDF Writer

```ranger
Import "Buffer.rgr"
Import "JPEGReader.rgr"
Import "JPEGMetadata.rgr"

class Main {
    sfn m@(main):void () {
        def writer (new PDFWriter())
        writer.savePDF("./output" "test.pdf" "Hello!")
        writer.savePDFWithImage("./output" "photo.pdf" "Title" "./images" "photo.jpg")
    }
}
```

### JPEG Decoder

```ranger
Import "JPEGDecoder.rgr"

class Main {
    sfn m@(main):void () {
        def decoder (new JPEGDecoder())
        decoder.loadFile("./gallery/pdf_writer" "Canon_40D.jpg")
        decoder.decode()

        ; Save as PPM
        def ppm (new PPMImage())
        ppm.save(decoder.image "./gallery/pdf_writer" "decoded_output.ppm")
    }
}
```

## Notes

### GPS Coordinates

GPS data in EXIF is stored as three RATIONALs (degrees, minutes, seconds). Output format:

```
43° 27' 52.43" N
11° 52' 55.43" E
```

### JPEG Embedding

Uses `/Filter /DCTDecode` to embed raw JPEG data without re-encoding.

### Buffer System

`GrowableBuffer` uses linked list of chunks to avoid large reallocations.

### JPEG Decoder Architecture

The decoder implements baseline DCT JPEG (the most common format):

1. **Marker Parsing** - Reads JPEG structure (SOI, DQT, DHT, SOF0, SOS, EOI)
2. **Huffman Decoding** - Decodes entropy-coded scan data using DC/AC tables
3. **Dequantization** - Applies quantization tables to DCT coefficients
4. **IDCT** - 8x8 Inverse Discrete Cosine Transform per block
5. **YCbCr→RGB** - Color space conversion for final output

Supported:

- Baseline DCT (SOF0)
- 8x8 MCU blocks
- YCbCr color images (3 components)
- Grayscale images (1 component)

Not supported:

- Progressive JPEG
- Arithmetic coding
- Subsampled chroma (4:2:0, 4:2:2)
