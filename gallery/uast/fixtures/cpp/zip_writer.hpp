// Twin of gallery/zip/ZipWriter.rgr at the “80 % CodeGraph” level.
// Not executed. The C++ adapter should produce the same class / field /
// type / call picture as zip_writer.ts, calling crc.update.

class ZipEntry {};

class GrowableZipBuffer {};

class CRC32 {
public:
    int update(std::vector<uint8_t> data) {
        return 0;
    }
};

class ZipWriter {
public:
    std::vector<ZipEntry> entries;
    GrowableZipBuffer output;
    // Cyclic redundancy used while writing local headers.
    CRC32 crc;

    void addFile(std::string name, std::vector<uint8_t> data) {
        this->crc.update(data);
    }
};
