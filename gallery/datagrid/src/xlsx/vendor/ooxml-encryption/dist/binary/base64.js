const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const reverse = new Int16Array(256).fill(-1);
for (let i = 0; i < alphabet.length; i += 1)
    reverse[alphabet.charCodeAt(i)] = i;
export function encodeBase64(bytes) {
    let output = "";
    let i = 0;
    for (; i + 2 < bytes.length; i += 3) {
        const value = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        output += alphabet.charAt((value >>> 18) & 0x3f);
        output += alphabet.charAt((value >>> 12) & 0x3f);
        output += alphabet.charAt((value >>> 6) & 0x3f);
        output += alphabet.charAt(value & 0x3f);
    }
    if (i < bytes.length) {
        const first = bytes[i];
        const second = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const value = (first << 16) | (second << 8);
        output += alphabet.charAt((value >>> 18) & 0x3f);
        output += alphabet.charAt((value >>> 12) & 0x3f);
        output += i + 1 < bytes.length ? alphabet.charAt((value >>> 6) & 0x3f) : "=";
        output += "=";
    }
    return output;
}
export function decodeBase64(input) {
    const clean = input.replace(/\s+/g, "");
    if (clean.length % 4 !== 0)
        throw new Error("Invalid base64 length");
    const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
    const output = new Uint8Array((clean.length / 4) * 3 - padding);
    let outputOffset = 0;
    for (let i = 0; i < clean.length; i += 4) {
        const a = readBase64Char(clean, i);
        const b = readBase64Char(clean, i + 1);
        const c = clean[i + 2] === "=" ? 0 : readBase64Char(clean, i + 2);
        const d = clean[i + 3] === "=" ? 0 : readBase64Char(clean, i + 3);
        const value = (a << 18) | (b << 12) | (c << 6) | d;
        if (outputOffset < output.length)
            output[outputOffset++] = (value >>> 16) & 0xff;
        if (outputOffset < output.length)
            output[outputOffset++] = (value >>> 8) & 0xff;
        if (outputOffset < output.length)
            output[outputOffset++] = value & 0xff;
    }
    return output;
}
function readBase64Char(input, index) {
    const code = input.charCodeAt(index);
    const value = code < reverse.length ? reverse[code] : -1;
    if (value < 0)
        throw new Error("Invalid base64 character");
    return value;
}
//# sourceMappingURL=base64.js.map