import { concatBytes, padEnd, uint32LE } from "../binary/bytes.js";
import { utf16leEncode } from "../binary/text.js";
import { digest } from "../crypto/webcrypto.js";
export async function derivePasswordHash(password, salt, hashAlgorithm, spinCount) {
    let hash = await digest(hashAlgorithm, concatBytes([salt, utf16leEncode(password)]));
    for (let i = 0; i < spinCount; i += 1) {
        hash = await digest(hashAlgorithm, concatBytes([uint32LE(i), hash]));
    }
    return hash;
}
export async function deriveBlockKey(passwordHash, blockKey, hashAlgorithm, keyBytes) {
    const hash = await digest(hashAlgorithm, concatBytes([passwordHash, blockKey]));
    return resizeHash(hash, keyBytes);
}
export async function deriveIv(salt, blockKey, hashAlgorithm, blockSize) {
    const hash = await digest(hashAlgorithm, concatBytes([salt, blockKey]));
    return resizeHash(hash, blockSize);
}
export function deriveIvFromSalt(salt, blockSize) {
    return resizeHash(salt, blockSize);
}
export function zeroPadToBlock(bytes, blockSize) {
    return padEnd(bytes, blockSize, 0);
}
function resizeHash(hash, length) {
    if (hash.length >= length)
        return hash.slice(0, length);
    const output = new Uint8Array(length);
    output.set(hash);
    output.fill(0x36, hash.length);
    return output;
}
//# sourceMappingURL=key-derivation.js.map