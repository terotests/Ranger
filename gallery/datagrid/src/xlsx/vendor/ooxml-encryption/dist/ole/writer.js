import { concatBytes, padEnd, writeUInt16LE, writeUInt32LE, writeUInt64LE } from "../binary/bytes.js";
import { utf16leEncode } from "../binary/text.js";
import { CFB_SIGNATURE, DIFAT_SECT, END_OF_CHAIN, FAT_SECT, FREE_SECT, MINI_SECTOR_SIZE, MINI_STREAM_CUTOFF, NO_STREAM, SECTOR_SIZE, } from "./types.js";
const dataSpacesStorageName = "\u0006DataSpaces";
const primaryStreamName = "\u0006Primary";
export function writeOleStreams(streams) {
    const outputStreams = new Map(streams);
    for (const [name, bytes] of createDataSpacesStreams()) {
        if (!outputStreams.has(name))
            outputStreams.set(name, bytes);
    }
    const prepared = [...outputStreams.entries()].map(([name, bytes]) => ({
        name,
        bytes,
        size: bytes.length,
        useMini: bytes.length > 0 && bytes.length < MINI_STREAM_CUTOFF,
        startSector: END_OF_CHAIN,
        miniStartSector: END_OF_CHAIN,
    }));
    const mini = buildMiniStream(prepared);
    const regularContents = [];
    const regularSectorStarts = new Map();
    for (const stream of prepared) {
        if (stream.useMini || stream.size === 0)
            continue;
        regularSectorStarts.set(stream.name, countSectors(regularContents));
        regularContents.push(...splitIntoSectors(stream.bytes));
    }
    const rootMiniStart = mini.stream.length === 0 ? END_OF_CHAIN : countSectors(regularContents);
    if (mini.stream.length > 0)
        regularContents.push(...splitIntoSectors(mini.stream));
    const miniFatStart = mini.fatSectors.length === 0 ? END_OF_CHAIN : countSectors(regularContents);
    regularContents.push(...mini.fatSectors);
    for (const stream of prepared) {
        if (stream.useMini) {
            stream.startSector = stream.miniStartSector;
        }
        else {
            stream.startSector = stream.size === 0 ? END_OF_CHAIN : regularSectorStarts.get(stream.name);
        }
    }
    const directory = buildDirectory(prepared, rootMiniStart, mini.stream.length);
    const directoryStart = countSectors(regularContents);
    regularContents.push(...splitIntoSectors(directory));
    const nonFatSectorCount = countSectors(regularContents);
    const { fatSectorCount, difatSectorCount } = computeAllocationCounts(nonFatSectorCount);
    const fatSectorStart = nonFatSectorCount;
    const difatSectorStart = fatSectorStart + fatSectorCount;
    const totalSectorCount = nonFatSectorCount + fatSectorCount + difatSectorCount;
    const fat = new Array(roundUpToMultiple(totalSectorCount, SECTOR_SIZE / 4)).fill(FREE_SECT);
    markRegularStreamChains(fat, prepared);
    markChain(fat, rootMiniStart, sectorCountForBytes(mini.stream.length));
    markChain(fat, miniFatStart, mini.fatSectors.length);
    markChain(fat, directoryStart, sectorCountForBytes(directory.length));
    for (let i = 0; i < fatSectorCount; i += 1)
        fat[fatSectorStart + i] = FAT_SECT;
    for (let i = 0; i < difatSectorCount; i += 1)
        fat[difatSectorStart + i] = DIFAT_SECT;
    const sectorContents = new Array(totalSectorCount);
    regularContents.forEach((content, index) => { sectorContents[index] = content; });
    const fatSectors = buildFatSectors(fat, fatSectorCount);
    fatSectors.forEach((content, index) => { sectorContents[fatSectorStart + index] = content; });
    const fatSectorIds = Array.from({ length: fatSectorCount }, (_, index) => fatSectorStart + index);
    const difatSectors = buildDifatSectors(fatSectorIds, difatSectorCount, difatSectorStart);
    difatSectors.forEach((content, index) => { sectorContents[difatSectorStart + index] = content; });
    const header = buildHeader({
        fatSectorCount,
        firstDirectorySector: directoryStart,
        firstMiniFatSector: miniFatStart,
        miniFatSectorCount: mini.fatSectors.length,
        firstDifatSector: difatSectorCount === 0 ? END_OF_CHAIN : difatSectorStart,
        difatSectorCount,
        fatSectorIds,
    });
    return concatBytes([header, ...sectorContents.map((sector) => sector ?? emptySector())]);
}
function createDataSpacesStreams() {
    return new Map([
        ["DataSpaceMap", padEnd(concatBytes([
                u32(8),
                u32(1),
                u32(0x68),
                u32(1),
                u32(0),
                lengthPrefixedUnicode("EncryptedPackage"),
                lengthPrefixedUnicode("StrongEncryptionDataSpace"),
            ]), 4)],
        ["StrongEncryptionDataSpace", padEnd(concatBytes([
                u32(8),
                u32(1),
                lengthPrefixedUnicode("StrongEncryptionTransform"),
            ]), 4)],
        [primaryStreamName, padEnd(concatBytes([
                u32(0x58),
                u32(1),
                lengthPrefixedUnicode("{FF9A3F03-56EF-4613-BDD5-5A41C1D07246}"),
                lengthPrefixedUnicode("Microsoft.Container.EncryptionTransform"),
                new Uint8Array([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0]),
            ]), 4)],
        ["Version", concatBytes([
                lengthPrefixedUnicode("Microsoft.Container.DataSpaces"),
                u32(1),
                u32(1),
                u32(1),
            ])],
    ]);
}
function buildMiniStream(streams) {
    const miniSectors = [];
    const miniFat = [];
    for (const stream of streams) {
        if (!stream.useMini)
            continue;
        stream.miniStartSector = miniSectors.length;
        const sectorCount = Math.max(1, Math.ceil(stream.bytes.length / MINI_SECTOR_SIZE));
        for (let i = 0; i < sectorCount; i += 1) {
            const sector = new Uint8Array(MINI_SECTOR_SIZE);
            sector.set(stream.bytes.slice(i * MINI_SECTOR_SIZE, (i + 1) * MINI_SECTOR_SIZE));
            miniSectors.push(sector);
            miniFat.push(i === sectorCount - 1 ? END_OF_CHAIN : stream.miniStartSector + i + 1);
        }
    }
    if (miniSectors.length === 0)
        return { stream: new Uint8Array(), fatSectors: [] };
    const entriesPerSector = SECTOR_SIZE / 4;
    const paddedFatLength = roundUpToMultiple(miniFat.length, entriesPerSector);
    while (miniFat.length < paddedFatLength)
        miniFat.push(FREE_SECT);
    return { stream: concatBytes(miniSectors), fatSectors: sectorTableToSectors(miniFat) };
}
function buildDirectory(streams, rootMiniStart, rootMiniSize) {
    const streamByName = new Map(streams.map((stream) => [stream.name, stream]));
    const nodes = [];
    const rootId = addStorage(nodes, "Root Entry", rootMiniStart, BigInt(rootMiniSize));
    const dataSpacesId = addStorage(nodes, dataSpacesStorageName);
    const dataSpaceInfoId = addStorage(nodes, "DataSpaceInfo");
    const strongEncryptionDataSpaceId = addStream(nodes, requiredStream(streamByName, "StrongEncryptionDataSpace"));
    const dataSpaceMapId = addStream(nodes, requiredStream(streamByName, "DataSpaceMap"));
    const transformInfoId = addStorage(nodes, "TransformInfo");
    const strongEncryptionTransformId = addStorage(nodes, "StrongEncryptionTransform");
    const primaryId = addStream(nodes, requiredStream(streamByName, primaryStreamName));
    const versionId = addStream(nodes, requiredStream(streamByName, "Version"));
    const rootChildren = [dataSpacesId];
    for (const stream of streams) {
        if (isDataSpacesStream(stream.name))
            continue;
        rootChildren.push(addStream(nodes, stream));
    }
    linkChildren(nodes, rootId, rootChildren);
    linkChildren(nodes, dataSpacesId, [dataSpaceInfoId, dataSpaceMapId, transformInfoId, versionId]);
    linkChildren(nodes, dataSpaceInfoId, [strongEncryptionDataSpaceId]);
    linkChildren(nodes, transformInfoId, [strongEncryptionTransformId]);
    linkChildren(nodes, strongEncryptionTransformId, [primaryId]);
    const entryCount = roundUpToMultiple(nodes.length, 4);
    const directory = new Uint8Array(entryCount * 128);
    nodes.forEach((node, id) => writeDirectoryEntry(directory, id * 128, node));
    return directory;
}
function addStorage(nodes, name, startSector = 0, size = 0n) {
    return addNode(nodes, { name, type: 1, startSector, size, left: NO_STREAM, right: NO_STREAM, child: NO_STREAM });
}
function addStream(nodes, stream) {
    return addNode(nodes, {
        name: stream.name,
        type: 2,
        startSector: stream.startSector,
        size: BigInt(stream.size),
        left: NO_STREAM,
        right: NO_STREAM,
        child: NO_STREAM,
    });
}
function addNode(nodes, node) {
    const id = nodes.length;
    nodes.push(node);
    return id;
}
function linkChildren(nodes, parentId, childIds) {
    nodes[parentId].child = buildSiblingTree(nodes, [...childIds].sort((left, right) => compareDirectoryNames(nodes[left].name, nodes[right].name)));
}
function buildSiblingTree(nodes, childIds) {
    if (childIds.length === 0)
        return NO_STREAM;
    const middle = Math.floor(childIds.length / 2);
    const id = childIds[middle];
    nodes[id].left = buildSiblingTree(nodes, childIds.slice(0, middle));
    nodes[id].right = buildSiblingTree(nodes, childIds.slice(middle + 1));
    return id;
}
function compareDirectoryNames(left, right) {
    const leftUpper = left.toUpperCase();
    const rightUpper = right.toUpperCase();
    if (leftUpper.length !== rightUpper.length)
        return leftUpper.length - rightUpper.length;
    return leftUpper < rightUpper ? -1 : leftUpper > rightUpper ? 1 : 0;
}
function requiredStream(streams, name) {
    const stream = streams.get(name);
    if (!stream)
        throw new Error(`Missing required OLE stream: ${name}`);
    return stream;
}
function isDataSpacesStream(name) {
    return name === "DataSpaceMap" || name === "StrongEncryptionDataSpace" || name === primaryStreamName || name === "Version";
}
function writeDirectoryEntry(directory, offset, entry) {
    const name = `${entry.name}\0`;
    if (name.length * 2 > 64)
        throw new Error(`OLE directory name is too long: ${entry.name}`);
    for (let i = 0; i < name.length; i += 1)
        writeUInt16LE(directory, offset + i * 2, name.charCodeAt(i));
    writeUInt16LE(directory, offset + 64, name.length * 2);
    directory[offset + 66] = entry.name === "Root Entry" ? 5 : entry.type;
    directory[offset + 67] = 1;
    writeUInt32LE(directory, offset + 68, entry.left);
    writeUInt32LE(directory, offset + 72, entry.right);
    writeUInt32LE(directory, offset + 76, entry.child);
    writeUInt32LE(directory, offset + 116, entry.startSector);
    writeUInt64LE(directory, offset + 120, entry.size);
}
function computeAllocationCounts(nonFatSectorCount) {
    let fatSectorCount = 0;
    let difatSectorCount = 0;
    while (true) {
        const nextFatSectorCount = Math.ceil((nonFatSectorCount + fatSectorCount + difatSectorCount) / (SECTOR_SIZE / 4));
        const nextDifatSectorCount = Math.max(0, Math.ceil((nextFatSectorCount - 109) / ((SECTOR_SIZE / 4) - 1)));
        if (nextFatSectorCount === fatSectorCount && nextDifatSectorCount === difatSectorCount) {
            return { fatSectorCount, difatSectorCount };
        }
        fatSectorCount = nextFatSectorCount;
        difatSectorCount = nextDifatSectorCount;
    }
}
function markRegularStreamChains(fat, streams) {
    for (const stream of streams) {
        if (stream.useMini || stream.size === 0)
            continue;
        markChain(fat, stream.startSector, sectorCountForBytes(stream.size));
    }
}
function markChain(fat, start, count) {
    if (start === END_OF_CHAIN || count === 0)
        return;
    for (let i = 0; i < count; i += 1)
        fat[start + i] = i === count - 1 ? END_OF_CHAIN : start + i + 1;
}
function buildFatSectors(fat, fatSectorCount) {
    return sectorTableToSectors(fat.slice(0, fatSectorCount * (SECTOR_SIZE / 4)));
}
function buildDifatSectors(fatSectorIds, difatSectorCount, difatSectorStart) {
    if (difatSectorCount === 0)
        return [];
    const ids = fatSectorIds.slice(109);
    const sectors = [];
    const entriesPerSector = SECTOR_SIZE / 4 - 1;
    for (let sectorIndex = 0; sectorIndex < difatSectorCount; sectorIndex += 1) {
        const sector = emptySector();
        for (let i = 0; i < entriesPerSector; i += 1) {
            const value = ids[sectorIndex * entriesPerSector + i] ?? FREE_SECT;
            writeUInt32LE(sector, i * 4, value);
        }
        const next = sectorIndex === difatSectorCount - 1 ? END_OF_CHAIN : difatSectorStart + sectorIndex + 1;
        writeUInt32LE(sector, SECTOR_SIZE - 4, next);
        sectors.push(sector);
    }
    return sectors;
}
function buildHeader(input) {
    const header = new Uint8Array(SECTOR_SIZE);
    header.set(CFB_SIGNATURE);
    writeUInt16LE(header, 0x18, 0x003e);
    writeUInt16LE(header, 0x1a, 0x0003);
    writeUInt16LE(header, 0x1c, 0xfffe);
    writeUInt16LE(header, 0x1e, 9);
    writeUInt16LE(header, 0x20, 6);
    writeUInt32LE(header, 0x28, 0);
    writeUInt32LE(header, 0x2c, input.fatSectorCount);
    writeUInt32LE(header, 0x30, input.firstDirectorySector);
    writeUInt32LE(header, 0x38, MINI_STREAM_CUTOFF);
    writeUInt32LE(header, 0x3c, input.firstMiniFatSector);
    writeUInt32LE(header, 0x40, input.miniFatSectorCount);
    writeUInt32LE(header, 0x44, input.firstDifatSector);
    writeUInt32LE(header, 0x48, input.difatSectorCount);
    for (let i = 0; i < 109; i += 1)
        writeUInt32LE(header, 0x4c + i * 4, input.fatSectorIds[i] ?? FREE_SECT);
    return header;
}
function splitIntoSectors(bytes) {
    if (bytes.length === 0)
        return [];
    const padded = padEnd(bytes, SECTOR_SIZE);
    const sectors = [];
    for (let offset = 0; offset < padded.length; offset += SECTOR_SIZE)
        sectors.push(padded.slice(offset, offset + SECTOR_SIZE));
    return sectors;
}
function sectorTableToSectors(entries) {
    const paddedLength = roundUpToMultiple(entries.length, SECTOR_SIZE / 4);
    const sectors = [];
    for (let offset = 0; offset < paddedLength; offset += SECTOR_SIZE / 4) {
        const sector = emptySector();
        for (let i = 0; i < SECTOR_SIZE / 4; i += 1)
            writeUInt32LE(sector, i * 4, entries[offset + i] ?? FREE_SECT);
        sectors.push(sector);
    }
    return sectors;
}
function lengthPrefixedUnicode(value) {
    const encoded = utf16leEncode(value);
    return concatBytes([u32(encoded.length), encoded]);
}
function u32(value) {
    const bytes = new Uint8Array(4);
    writeUInt32LE(bytes, 0, value);
    return bytes;
}
function sectorCountForBytes(length) {
    return length === 0 ? 0 : Math.ceil(length / SECTOR_SIZE);
}
function countSectors(sectors) {
    return sectors.length;
}
function roundUpToMultiple(value, multiple) {
    return Math.ceil(value / multiple) * multiple;
}
function emptySector() {
    const sector = new Uint8Array(SECTOR_SIZE);
    sector.fill(0xff);
    return sector;
}
//# sourceMappingURL=writer.js.map