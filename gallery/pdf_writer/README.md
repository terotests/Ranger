# Ranger PDF Writer

## Usage

```bash
# From project root
npm run pdf
```

This compiles and runs PDFWriter.rgr, generating sample PDFs in this directory.

To run JPEG metadata parser standalone:

```bash
npm run jpegmeta
```

## Output Files

- `hello_world.pdf` - Basic PDF with shapes and text
- `hello_with_image.pdf` - PDF with Example.jpg
- `canon_with_metadata.pdf` - PDF with Canon_40D.jpg and EXIF data
- `gps_with_metadata.pdf` - PDF with GPS_test.jpg and GPS coordinates

## Files

| File               | Description                                   |
| ------------------ | --------------------------------------------- |
| `Buffer.rgr`       | GrowableBuffer with linked list of 4KB chunks |
| `JPEGReader.rgr`   | JPEG parser for dimensions                    |
| `JPEGMetadata.rgr` | EXIF/JFIF/GPS metadata parser                 |
| `PDFWriter.rgr`    | PDF generator                                 |

## Example

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
