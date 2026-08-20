import { concatBytes } from "../binary/bytes.js";
const aesBlockSize = 16;
export async function digest(algorithm, bytes) {
    const result = await subtle().digest(algorithm, toCryptoBytes(bytes));
    return new Uint8Array(result);
}
export async function hmac(algorithm, keyBytes, bytes) {
    const key = await subtle().importKey("raw", toCryptoBytes(keyBytes), { name: "HMAC", hash: algorithm }, false, ["sign"]);
    const result = await subtle().sign("HMAC", key, toCryptoBytes(bytes));
    return new Uint8Array(result);
}
export async function aesCbcEncrypt(keyBytes, iv, bytes) {
    const key = await importAesKey(keyBytes, ["encrypt"]);
    const result = await subtle().encrypt({ name: "AES-CBC", iv: toCryptoBytes(iv) }, key, toCryptoBytes(bytes));
    return new Uint8Array(result);
}
export async function aesCbcDecrypt(keyBytes, iv, bytes) {
    const key = await importAesKey(keyBytes, ["decrypt"]);
    const result = await subtle().decrypt({ name: "AES-CBC", iv: toCryptoBytes(iv) }, key, toCryptoBytes(bytes));
    return new Uint8Array(result);
}
export async function aesCbcEncryptBlockPadded(keyBytes, iv, bytes) {
    if (bytes.length % aesBlockSize !== 0)
        throw new Error("AES-CBC raw input must be block aligned");
    if (bytes.length === 0)
        return new Uint8Array();
    const encrypted = await aesCbcEncrypt(keyBytes, iv, bytes);
    return encrypted.slice(0, encrypted.length - aesBlockSize);
}
export async function aesCbcDecryptBlockPadded(keyBytes, iv, bytes) {
    if (bytes.length % aesBlockSize !== 0)
        throw new Error("AES-CBC raw input must be block aligned");
    if (bytes.length === 0)
        return new Uint8Array();
    const key = await importAesKey(keyBytes, ["encrypt", "decrypt"]);
    const lastCipherBlock = bytes.slice(bytes.length - aesBlockSize);
    const syntheticPlainBlock = new Uint8Array(aesBlockSize);
    syntheticPlainBlock.fill(aesBlockSize);
    for (let i = 0; i < syntheticPlainBlock.length; i += 1)
        syntheticPlainBlock[i] = syntheticPlainBlock[i] ^ lastCipherBlock[i];
    const syntheticEncrypted = new Uint8Array(await subtle().encrypt({ name: "AES-CBC", iv: toCryptoBytes(new Uint8Array(aesBlockSize)) }, key, toCryptoBytes(syntheticPlainBlock)));
    const combined = concatBytes([bytes, syntheticEncrypted.slice(0, aesBlockSize)]);
    const decrypted = await subtle().decrypt({ name: "AES-CBC", iv: toCryptoBytes(iv) }, key, toCryptoBytes(combined));
    return new Uint8Array(decrypted);
}
export function randomBytes(length) {
    if (!Number.isInteger(length) || length < 0)
        throw new RangeError("Random byte length must be non-negative");
    const output = new Uint8Array(length);
    globalCrypto().getRandomValues(output);
    return output;
}
async function importAesKey(keyBytes, usages) {
    return subtle().importKey("raw", toCryptoBytes(keyBytes), "AES-CBC", false, usages);
}
function toCryptoBytes(bytes) {
    return new Uint8Array(bytes);
}
function subtle() {
    const crypto = globalCrypto();
    if (!crypto.subtle)
        throw new Error("WebCrypto subtle API is unavailable");
    return crypto.subtle;
}
function globalCrypto() {
    if (!globalThis.crypto)
        throw new Error("WebCrypto is unavailable");
    return globalThis.crypto;
}
//# sourceMappingURL=webcrypto.js.map