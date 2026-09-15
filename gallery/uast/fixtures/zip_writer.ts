// Twin of gallery/zip/ZipWriter.rgr at the “80 % CodeGraph” level.
// Not executed. The TS adapter (milestone 3) should produce the same
// class / field / type / call picture as UastSample.zipWriter(), with
// one honest difference: this file calls crc.update; the Ranger source
// calls crc.compute.

class ZipEntry {}

class GrowableZipBuffer {}

class CRC32 {
    update(data: Buffer): number {
        return 0
    }
}

class ZipWriter {
    entries: ZipEntry[]
    output: GrowableZipBuffer
    crc: CRC32

    addFile(name: string, data: Buffer) {
        this.crc.update(data)
    }
}
