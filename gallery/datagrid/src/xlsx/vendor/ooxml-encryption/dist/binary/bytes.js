export function readUInt16LE(bytes, offset) {
    requireAvailable(bytes, offset, 2);
    return bytes[offset] | (bytes[offset + 1] << 8);
}
export function readUInt32LE(bytes, offset) {
    requireAvailable(bytes, offset, 4);
    return (bytes[offset] +
        bytes[offset + 1] * 0x100 +
        bytes[offset + 2] * 0x10000 +
        bytes[offset + 3] * 0x1000000) >>> 0;
}
export function readInt32LE(bytes, offset) {
    return readUInt32LE(bytes, offset) | 0;
}
export function readUInt64LE(bytes, offset) {
    const low = BigInt(readUInt32LE(bytes, offset));
    const high = BigInt(readUInt32LE(bytes, offset + 4));
    return low | (high << 32n);
}
export function writeUInt16LE(bytes, offset, value) {
    requireAvailable(bytes, offset, 2);
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
}
export function writeUInt32LE(bytes, offset, value) {
    requireAvailable(bytes, offset, 4);
    const unsigned = value >>> 0;
    bytes[offset] = unsigned & 0xff;
    bytes[offset + 1] = (unsigned >>> 8) & 0xff;
    bytes[offset + 2] = (unsigned >>> 16) & 0xff;
    bytes[offset + 3] = (unsigned >>> 24) & 0xff;
}
export function writeInt32LE(bytes, offset, value) {
    writeUInt32LE(bytes, offset, value);
}
export function writeUInt64LE(bytes, offset, value) {
    requireAvailable(bytes, offset, 8);
    const low = Number(value & 0xffffffffn);
    const high = Number((value >> 32n) & 0xffffffffn);
    writeUInt32LE(bytes, offset, low);
    writeUInt32LE(bytes, offset + 4, high);
}
export function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        output.set(part, offset);
        offset += part.length;
    }
    return output;
}
export function sliceExact(bytes, offset, length) {
    requireAvailable(bytes, offset, length);
    return bytes.slice(offset, offset + length);
}
export function padEnd(bytes, blockSize, fill = 0) {
    if (blockSize <= 0)
        throw new RangeError("Block size must be positive");
    const remainder = bytes.length % blockSize;
    if (remainder === 0)
        return bytes.slice();
    const output = new Uint8Array(bytes.length + blockSize - remainder);
    output.fill(fill);
    output.set(bytes);
    return output;
}
export function pkcs7Pad(bytes, blockSize) {
    if (blockSize <= 0 || blockSize > 255)
        throw new RangeError("Block size must be between 1 and 255");
    const padding = blockSize - (bytes.length % blockSize || blockSize);
    const padLength = padding === 0 ? blockSize : padding;
    const output = new Uint8Array(bytes.length + padLength);
    output.set(bytes);
    output.fill(padLength, bytes.length);
    return output;
}
export function pkcs7Unpad(bytes, blockSize) {
    if (blockSize <= 0 || blockSize > 255)
        throw new RangeError("Block size must be between 1 and 255");
    if (bytes.length === 0 || bytes.length % blockSize !== 0)
        throw new Error("Invalid PKCS#7 padding");
    const padLength = bytes[bytes.length - 1];
    if (padLength === 0 || padLength > blockSize || padLength > bytes.length)
        throw new Error("Invalid PKCS#7 padding");
    for (let i = bytes.length - padLength; i < bytes.length; i += 1) {
        if (bytes[i] !== padLength)
            throw new Error("Invalid PKCS#7 padding");
    }
    return bytes.slice(0, bytes.length - padLength);
}
export function constantTimeEqual(left, right) {
    let diff = left.length ^ right.length;
    const length = Math.max(left.length, right.length);
    for (let i = 0; i < length; i += 1) {
        diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
    }
    return diff === 0;
}
export function uint32LE(value) {
    const output = new Uint8Array(4);
    writeUInt32LE(output, 0, value);
    return output;
}
export function requireAvailable(bytes, offset, length) {
    if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0 || offset + length > bytes.length) {
        throw new RangeError("Byte range is outside the input");
    }
}
//# sourceMappingURL=bytes.js.map