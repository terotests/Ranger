const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();
export function utf8Encode(value) {
    return utf8Encoder.encode(value);
}
export function utf8Decode(bytes) {
    return utf8Decoder.decode(bytes);
}
export function utf16leEncode(value) {
    const output = new Uint8Array(value.length * 2);
    for (let i = 0; i < value.length; i += 1) {
        const code = value.charCodeAt(i);
        output[i * 2] = code & 0xff;
        output[i * 2 + 1] = code >>> 8;
    }
    return output;
}
export function utf16leDecode(bytes) {
    if (bytes.length % 2 !== 0)
        throw new Error("UTF-16LE input length must be even");
    let output = "";
    for (let i = 0; i < bytes.length; i += 2) {
        output += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
    }
    return output;
}
//# sourceMappingURL=text.js.map