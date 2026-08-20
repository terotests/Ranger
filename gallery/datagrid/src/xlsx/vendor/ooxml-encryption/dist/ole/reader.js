import { concatBytes, readUInt16LE, readUInt32LE, readUInt64LE, sliceExact } from "../binary/bytes.js";
import { utf16leDecode } from "../binary/text.js";
import { ooxmlError } from "../errors.js";
import { CFB_SIGNATURE, DIFAT_SECT, END_OF_CHAIN, FAT_SECT, FREE_SECT, MINI_SECTOR_SIZE, SECTOR_SIZE, } from "./types.js";
export function readOleStreams(input, names) {
    const ole = parseOle(input);
    const entries = new Map(ole.directory.map((entry) => [entry.name, entry]));
    const output = new Map();
    for (const name of names) {
        const entry = entries.get(name);
        if (!entry || entry.type !== 2)
            throw ooxmlError("missingOleStream", `Missing OLE stream: ${name}`);
        output.set(name, readStream(ole, entry));
    }
    return output;
}
function parseOle(input) {
    validateHeader(input);
    const sectorShift = readUInt16LE(input, 0x1e);
    const miniSectorShift = readUInt16LE(input, 0x20);
    const sectorSize = 1 << sectorShift;
    const miniSectorSize = 1 << miniSectorShift;
    if (sectorSize !== SECTOR_SIZE || miniSectorSize !== MINI_SECTOR_SIZE) {
        throw ooxmlError("invalidOleContainer", "Only 512-byte CFB sectors and 64-byte mini sectors are supported");
    }
    const fatSectorCount = readUInt32LE(input, 0x2c);
    const firstDirectorySector = readUInt32LE(input, 0x30);
    const miniStreamCutoff = readUInt32LE(input, 0x38);
    const firstMiniFatSector = readUInt32LE(input, 0x3c);
    const miniFatSectorCount = readUInt32LE(input, 0x40);
    const firstDifatSector = readUInt32LE(input, 0x44);
    const difatSectorCount = readUInt32LE(input, 0x48);
    const difat = readDifat(input, sectorSize, fatSectorCount, firstDifatSector, difatSectorCount);
    const fat = readFat(input, sectorSize, difat.slice(0, fatSectorCount));
    const directoryBytes = readRegularChain(input, sectorSize, fat, firstDirectorySector);
    const directory = parseDirectory(directoryBytes);
    const root = directory.find((entry) => entry.type === 5);
    if (!root)
        throw ooxmlError("invalidOleContainer", "OLE root storage is missing");
    const miniFatBytes = firstMiniFatSector === END_OF_CHAIN || miniFatSectorCount === 0
        ? new Uint8Array()
        : readRegularChain(input, sectorSize, fat, firstMiniFatSector, miniFatSectorCount * sectorSize);
    const miniFat = parseSectorTable(miniFatBytes);
    const miniStream = root.size === 0n ? new Uint8Array() : readRegularStream(input, sectorSize, fat, root.startSector, Number(root.size));
    return {
        input,
        sectorSize,
        miniSectorSize,
        miniStreamCutoff,
        firstDirectorySector,
        firstMiniFatSector,
        miniFatSectorCount,
        fat,
        directory,
        root,
        miniFat,
        miniStream,
    };
}
function validateHeader(input) {
    if (input.length < SECTOR_SIZE)
        throw ooxmlError("invalidOleContainer", "OLE container is smaller than the header");
    for (let i = 0; i < CFB_SIGNATURE.length; i += 1) {
        if (input[i] !== CFB_SIGNATURE[i])
            throw ooxmlError("invalidOleContainer", "Invalid OLE container signature");
    }
    if (readUInt16LE(input, 0x1c) !== 0xfffe)
        throw ooxmlError("invalidOleContainer", "Invalid OLE byte order");
}
function readDifat(input, sectorSize, fatSectorCount, firstDifatSector, difatSectorCount) {
    const output = [];
    for (let i = 0; i < 109; i += 1) {
        const sector = readUInt32LE(input, 0x4c + i * 4);
        if (sector !== FREE_SECT)
            output.push(sector);
    }
    let next = firstDifatSector;
    for (let i = 0; i < difatSectorCount; i += 1) {
        if (next === END_OF_CHAIN || next === FREE_SECT)
            throw ooxmlError("invalidOleContainer", "DIFAT chain ended early");
        const sector = sectorBytes(input, sectorSize, next);
        for (let offset = 0; offset < sectorSize - 4; offset += 4) {
            const value = readUInt32LE(sector, offset);
            if (value !== FREE_SECT)
                output.push(value);
        }
        next = readUInt32LE(sector, sectorSize - 4);
    }
    if (output.length < fatSectorCount)
        throw ooxmlError("invalidOleContainer", "FAT sector list is incomplete");
    return output;
}
function readFat(input, sectorSize, fatSectors) {
    const chunks = fatSectors.map((sector) => sectorBytes(input, sectorSize, sector));
    return parseSectorTable(concatBytes(chunks));
}
function parseSectorTable(bytes) {
    const output = [];
    for (let offset = 0; offset + 4 <= bytes.length; offset += 4)
        output.push(readUInt32LE(bytes, offset));
    return output;
}
function parseDirectory(bytes) {
    const entries = [];
    for (let offset = 0, id = 0; offset + 128 <= bytes.length; offset += 128, id += 1) {
        const type = bytes[offset + 66];
        if (type === 0)
            continue;
        const nameLength = readUInt16LE(bytes, offset + 64);
        if (nameLength < 2 || nameLength > 64 || nameLength % 2 !== 0) {
            throw ooxmlError("invalidOleContainer", "Invalid OLE directory entry name length");
        }
        const nameBytes = sliceExact(bytes, offset, nameLength - 2);
        entries.push({
            id,
            name: utf16leDecode(nameBytes),
            type,
            startSector: readUInt32LE(bytes, offset + 116),
            size: readUInt64LE(bytes, offset + 120),
        });
    }
    return entries;
}
function readStream(ole, entry) {
    const size = Number(entry.size);
    if (size === 0)
        return new Uint8Array();
    if (entry.size > BigInt(Number.MAX_SAFE_INTEGER))
        throw ooxmlError("invalidOleContainer", "OLE stream is too large");
    if (size < ole.miniStreamCutoff)
        return readMiniStream(ole, entry.startSector, size);
    return readRegularStream(ole.input, ole.sectorSize, ole.fat, entry.startSector, size);
}
function readRegularStream(input, sectorSize, fat, startSector, size) {
    return readRegularChain(input, sectorSize, fat, startSector, size).slice(0, size);
}
function readRegularChain(input, sectorSize, fat, startSector, maxBytes = Number.POSITIVE_INFINITY) {
    if (startSector === END_OF_CHAIN || startSector === FREE_SECT)
        return new Uint8Array();
    const chunks = [];
    const seen = new Set();
    let current = startSector;
    let bytesRead = 0;
    while (current !== END_OF_CHAIN) {
        if (current === FREE_SECT || current === FAT_SECT || current === DIFAT_SECT || current >= fat.length) {
            throw ooxmlError("invalidOleContainer", "Invalid OLE FAT chain sector");
        }
        if (seen.has(current))
            throw ooxmlError("invalidOleContainer", "OLE FAT chain contains a cycle");
        seen.add(current);
        const sector = sectorBytes(input, sectorSize, current);
        chunks.push(sector);
        bytesRead += sector.length;
        if (bytesRead >= maxBytes)
            break;
        current = fat[current] ?? END_OF_CHAIN;
    }
    return concatBytes(chunks);
}
function readMiniStream(ole, startMiniSector, size) {
    if (ole.miniFat.length === 0)
        throw ooxmlError("invalidOleContainer", "OLE mini FAT is missing");
    const chunks = [];
    const seen = new Set();
    let current = startMiniSector;
    let bytesRead = 0;
    while (current !== END_OF_CHAIN) {
        if (current === FREE_SECT || current >= ole.miniFat.length)
            throw ooxmlError("invalidOleContainer", "Invalid OLE mini FAT chain sector");
        if (seen.has(current))
            throw ooxmlError("invalidOleContainer", "OLE mini FAT chain contains a cycle");
        seen.add(current);
        const offset = current * ole.miniSectorSize;
        if (offset + ole.miniSectorSize > ole.miniStream.length)
            throw ooxmlError("invalidOleContainer", "OLE mini stream is truncated");
        chunks.push(ole.miniStream.slice(offset, offset + ole.miniSectorSize));
        bytesRead += ole.miniSectorSize;
        if (bytesRead >= size)
            break;
        current = ole.miniFat[current] ?? END_OF_CHAIN;
    }
    return concatBytes(chunks).slice(0, size);
}
function sectorBytes(input, sectorSize, sectorId) {
    const offset = SECTOR_SIZE + sectorId * sectorSize;
    if (sectorId < 0 || offset + sectorSize > input.length)
        throw ooxmlError("invalidOleContainer", "OLE sector is outside the file");
    return input.slice(offset, offset + sectorSize);
}
//# sourceMappingURL=reader.js.map