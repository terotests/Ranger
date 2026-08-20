import { readUInt16LE, readUInt32LE, sliceExact } from "../binary/bytes.js";
import { utf8Decode } from "../binary/text.js";
import { ooxmlError } from "../errors.js";
export class ZipReader {
    input;
    options;
    entries;
    constructor(input, options = {}) {
        this.input = input;
        this.options = options;
        this.entries = readCentralDirectory(input);
    }
    has(name) {
        return this.entries.has(normalizeZipPath(name));
    }
    async read(name) {
        const normalized = normalizeZipPath(name);
        const entry = this.entries.get(normalized);
        if (!entry)
            throw ooxmlError("unsupportedWorkbookStructure", `Missing ZIP entry: ${normalized}`);
        const compressed = readCompressedEntry(this.input, entry);
        if (entry.compressionMethod === 0)
            return compressed;
        if (entry.compressionMethod === 8) {
            if (!this.options.inflateRaw) {
                throw ooxmlError("decompressionUnavailable", `ZIP entry is deflated and no inflater was provided: ${normalized}`);
            }
            const inflated = await this.options.inflateRaw(compressed);
            if (inflated.length !== entry.uncompressedSize) {
                throw ooxmlError("unsupportedWorkbookStructure", `Inflated ZIP entry has the wrong size: ${normalized}`);
            }
            return inflated;
        }
        throw ooxmlError("unsupportedWorkbookStructure", `Unsupported ZIP compression method ${entry.compressionMethod}: ${normalized}`);
    }
}
function readCentralDirectory(input) {
    const eocdOffset = findEndOfCentralDirectory(input);
    const entryCount = readUInt16LE(input, eocdOffset + 10);
    const centralDirectorySize = readUInt32LE(input, eocdOffset + 12);
    const centralDirectoryOffset = readUInt32LE(input, eocdOffset + 16);
    if (centralDirectoryOffset + centralDirectorySize > input.length) {
        throw ooxmlError("unsupportedWorkbookStructure", "ZIP central directory is outside the file");
    }
    const entries = new Map();
    let offset = centralDirectoryOffset;
    for (let i = 0; i < entryCount; i += 1) {
        if (readUInt32LE(input, offset) !== 0x02014b50) {
            throw ooxmlError("unsupportedWorkbookStructure", "Invalid ZIP central directory header");
        }
        const compressionMethod = readUInt16LE(input, offset + 10);
        const compressedSize = readUInt32LE(input, offset + 20);
        const uncompressedSize = readUInt32LE(input, offset + 24);
        const nameLength = readUInt16LE(input, offset + 28);
        const extraLength = readUInt16LE(input, offset + 30);
        const commentLength = readUInt16LE(input, offset + 32);
        const localHeaderOffset = readUInt32LE(input, offset + 42);
        const name = normalizeZipPath(utf8Decode(sliceExact(input, offset + 46, nameLength)));
        entries.set(name, { name, compressionMethod, compressedSize, uncompressedSize, localHeaderOffset });
        offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
}
function findEndOfCentralDirectory(input) {
    const minimumOffset = Math.max(0, input.length - 65_557);
    for (let offset = input.length - 22; offset >= minimumOffset; offset -= 1) {
        if (readUInt32LE(input, offset) === 0x06054b50)
            return offset;
    }
    throw ooxmlError("unsupportedWorkbookStructure", "ZIP end-of-central-directory record is missing");
}
function readCompressedEntry(input, entry) {
    const offset = entry.localHeaderOffset;
    if (readUInt32LE(input, offset) !== 0x04034b50)
        throw ooxmlError("unsupportedWorkbookStructure", `Invalid ZIP local header: ${entry.name}`);
    const nameLength = readUInt16LE(input, offset + 26);
    const extraLength = readUInt16LE(input, offset + 28);
    const dataOffset = offset + 30 + nameLength + extraLength;
    return sliceExact(input, dataOffset, entry.compressedSize);
}
export function normalizeZipPath(path) {
    const parts = [];
    for (const part of path.replace(/\\/g, "/").split("/")) {
        if (!part || part === ".")
            continue;
        if (part === "..")
            parts.pop();
        else
            parts.push(part);
    }
    return parts.join("/");
}
//# sourceMappingURL=reader.js.map