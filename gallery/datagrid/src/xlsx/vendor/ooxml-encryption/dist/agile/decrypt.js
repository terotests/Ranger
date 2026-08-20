import { concatBytes, constantTimeEqual, readUInt64LE, uint32LE } from "../binary/bytes.js";
import { digest, hmac, aesCbcDecryptBlockPadded } from "../crypto/webcrypto.js";
import { ooxmlError } from "../errors.js";
import { readOleStreams } from "../ole/reader.js";
import { AGILE_PACKAGE_SEGMENT_SIZE, BLOCK_KEYS, hashXmlToWeb } from "./constants.js";
import { deriveBlockKey, deriveIv, deriveIvFromSalt, derivePasswordHash } from "./key-derivation.js";
import { parseEncryptionInfo } from "./xml.js";
export async function decryptWorkbook(input, password) {
    const streams = readOleStreams(input, ["EncryptionInfo", "EncryptedPackage"]);
    const info = parseEncryptionInfo(streams.get("EncryptionInfo"));
    const encryptedPackage = streams.get("EncryptedPackage");
    const packageKey = await decryptPackageKey(info, password);
    await verifyIntegrity(info, packageKey, encryptedPackage);
    return decryptPackagePayload(info, packageKey, encryptedPackage);
}
async function decryptPackageKey(info, password) {
    const passwordKey = info.passwordKey;
    const hashAlgorithm = hashXmlToWeb(passwordKey.hashAlgorithm);
    const keyBytes = passwordKey.keyBits / 8;
    const passwordHash = await derivePasswordHash(password, passwordKey.saltValue, hashAlgorithm, passwordKey.spinCount);
    const passwordIv = deriveIvFromSalt(passwordKey.saltValue, passwordKey.blockSize);
    const verifierKey = await deriveBlockKey(passwordHash, BLOCK_KEYS.encryptedVerifierHashInput, hashAlgorithm, keyBytes);
    const verifierInput = (await aesCbcDecryptBlockPadded(verifierKey, passwordIv, passwordKey.encryptedVerifierHashInput)).slice(0, passwordKey.saltSize);
    const verifierHashKey = await deriveBlockKey(passwordHash, BLOCK_KEYS.encryptedVerifierHashValue, hashAlgorithm, keyBytes);
    const decryptedVerifierHash = (await aesCbcDecryptBlockPadded(verifierHashKey, passwordIv, passwordKey.encryptedVerifierHashValue)).slice(0, passwordKey.hashSize);
    const actualVerifierHash = await digest(hashAlgorithm, verifierInput);
    if (!constantTimeEqual(decryptedVerifierHash, actualVerifierHash.slice(0, passwordKey.hashSize))) {
        throw ooxmlError("invalidPassword", "Invalid workbook password");
    }
    const keyValueKey = await deriveBlockKey(passwordHash, BLOCK_KEYS.encryptedKeyValue, hashAlgorithm, keyBytes);
    return (await aesCbcDecryptBlockPadded(keyValueKey, passwordIv, passwordKey.encryptedKeyValue)).slice(0, keyBytes);
}
async function verifyIntegrity(info, packageKey, encryptedPackage) {
    const keyData = info.keyData;
    const hashAlgorithm = hashXmlToWeb(keyData.hashAlgorithm);
    const hmacKeyIv = await deriveIv(keyData.saltValue, BLOCK_KEYS.encryptedHmacKey, hashAlgorithm, keyData.blockSize);
    const hmacValueIv = await deriveIv(keyData.saltValue, BLOCK_KEYS.encryptedHmacValue, hashAlgorithm, keyData.blockSize);
    const hmacKey = (await aesCbcDecryptBlockPadded(packageKey, hmacKeyIv, info.dataIntegrity.encryptedHmacKey)).slice(0, keyData.hashSize);
    const expectedHmac = (await aesCbcDecryptBlockPadded(packageKey, hmacValueIv, info.dataIntegrity.encryptedHmacValue)).slice(0, keyData.hashSize);
    const actualHmac = await hmac(hashAlgorithm, hmacKey, encryptedPackage);
    if (!constantTimeEqual(expectedHmac, actualHmac.slice(0, keyData.hashSize))) {
        throw ooxmlError("invalidPassword", "Invalid workbook password or corrupted encrypted package");
    }
}
async function decryptPackagePayload(info, packageKey, encryptedPackage) {
    if (encryptedPackage.length < 8)
        throw ooxmlError("invalidPassword", "EncryptedPackage stream is too short");
    const originalSize = Number(readUInt64LE(encryptedPackage, 0));
    if (!Number.isSafeInteger(originalSize))
        throw ooxmlError("unsupportedAgileParameters", "EncryptedPackage is too large");
    const keyData = info.keyData;
    const hashAlgorithm = hashXmlToWeb(keyData.hashAlgorithm);
    const encryptedPayload = encryptedPackage.slice(8);
    const decryptedSegments = [];
    let encryptedOffset = 0;
    let plainOffset = 0;
    let blockIndex = 0;
    while (plainOffset < originalSize) {
        const plainLength = Math.min(AGILE_PACKAGE_SEGMENT_SIZE, originalSize - plainOffset);
        const encryptedLength = Math.ceil(plainLength / keyData.blockSize) * keyData.blockSize;
        const encryptedSegment = encryptedPayload.slice(encryptedOffset, encryptedOffset + encryptedLength);
        if (encryptedSegment.length !== encryptedLength)
            throw ooxmlError("invalidPassword", "EncryptedPackage payload is truncated");
        const iv = await deriveIv(keyData.saltValue, uint32LE(blockIndex), hashAlgorithm, keyData.blockSize);
        const decrypted = await aesCbcDecryptBlockPadded(packageKey, iv, encryptedSegment);
        decryptedSegments.push(decrypted.slice(0, plainLength));
        encryptedOffset += encryptedLength;
        plainOffset += plainLength;
        blockIndex += 1;
    }
    return concatBytes(decryptedSegments);
}
//# sourceMappingURL=decrypt.js.map