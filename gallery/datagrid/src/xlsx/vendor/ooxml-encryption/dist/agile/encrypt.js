import { concatBytes, writeUInt64LE, uint32LE } from "../binary/bytes.js";
import { aesCbcEncryptBlockPadded, digest, hmac, randomBytes } from "../crypto/webcrypto.js";
import { writeOleStreams } from "../ole/writer.js";
import { AGILE_PACKAGE_SEGMENT_SIZE, BLOCK_KEYS, OUTPUT_BLOCK_SIZE, OUTPUT_HASH_ALGORITHM_WEB, OUTPUT_HASH_ALGORITHM_XML, OUTPUT_HASH_SIZE, OUTPUT_KEY_BITS, OUTPUT_KEY_BYTES, OUTPUT_SALT_SIZE, OUTPUT_SPIN_COUNT, } from "./constants.js";
import { deriveBlockKey, deriveIv, deriveIvFromSalt, derivePasswordHash, zeroPadToBlock } from "./key-derivation.js";
import { serializeEncryptionInfo } from "./xml.js";
export async function encryptWorkbook(input, password) {
    const packageKey = randomBytes(OUTPUT_KEY_BYTES);
    const keyDataSalt = randomBytes(OUTPUT_SALT_SIZE);
    const passwordSalt = randomBytes(OUTPUT_SALT_SIZE);
    const verifierInput = randomBytes(OUTPUT_SALT_SIZE);
    const hmacKey = randomBytes(OUTPUT_HASH_SIZE);
    const encryptedPayload = await encryptPackagePayload(input, packageKey, keyDataSalt);
    const encryptedPackage = new Uint8Array(8 + encryptedPayload.length);
    writeUInt64LE(encryptedPackage, 0, BigInt(input.length));
    encryptedPackage.set(encryptedPayload, 8);
    const encryptedHmacKey = await encryptWithPackageKey(packageKey, keyDataSalt, BLOCK_KEYS.encryptedHmacKey, hmacKey);
    const encryptedHmacValue = await encryptWithPackageKey(packageKey, keyDataSalt, BLOCK_KEYS.encryptedHmacValue, await hmac(OUTPUT_HASH_ALGORITHM_WEB, hmacKey, encryptedPackage));
    const passwordHash = await derivePasswordHash(password, passwordSalt, OUTPUT_HASH_ALGORITHM_WEB, OUTPUT_SPIN_COUNT);
    const encryptedVerifierHashInput = await encryptWithPasswordKey(passwordHash, passwordSalt, BLOCK_KEYS.encryptedVerifierHashInput, verifierInput);
    const encryptedVerifierHashValue = await encryptWithPasswordKey(passwordHash, passwordSalt, BLOCK_KEYS.encryptedVerifierHashValue, await digest(OUTPUT_HASH_ALGORITHM_WEB, verifierInput));
    const encryptedKeyValue = await encryptWithPasswordKey(passwordHash, passwordSalt, BLOCK_KEYS.encryptedKeyValue, packageKey);
    const info = {
        keyData: {
            saltSize: OUTPUT_SALT_SIZE,
            blockSize: OUTPUT_BLOCK_SIZE,
            keyBits: OUTPUT_KEY_BITS,
            hashSize: OUTPUT_HASH_SIZE,
            cipherAlgorithm: "AES",
            cipherChaining: "ChainingModeCBC",
            hashAlgorithm: OUTPUT_HASH_ALGORITHM_XML,
            saltValue: keyDataSalt,
        },
        dataIntegrity: {
            encryptedHmacKey,
            encryptedHmacValue,
        },
        passwordKey: {
            spinCount: OUTPUT_SPIN_COUNT,
            saltSize: OUTPUT_SALT_SIZE,
            blockSize: OUTPUT_BLOCK_SIZE,
            keyBits: OUTPUT_KEY_BITS,
            hashSize: OUTPUT_HASH_SIZE,
            cipherAlgorithm: "AES",
            cipherChaining: "ChainingModeCBC",
            hashAlgorithm: OUTPUT_HASH_ALGORITHM_XML,
            saltValue: passwordSalt,
            encryptedVerifierHashInput,
            encryptedVerifierHashValue,
            encryptedKeyValue,
        },
    };
    return writeOleStreams(new Map([
        ["EncryptionInfo", serializeEncryptionInfo(info)],
        ["EncryptedPackage", encryptedPackage],
    ]));
}
async function encryptPackagePayload(input, packageKey, salt) {
    const encryptedSegments = [];
    for (let offset = 0, blockIndex = 0; offset < input.length; offset += AGILE_PACKAGE_SEGMENT_SIZE, blockIndex += 1) {
        const segment = input.slice(offset, offset + AGILE_PACKAGE_SEGMENT_SIZE);
        const iv = await deriveIv(salt, uint32LE(blockIndex), OUTPUT_HASH_ALGORITHM_WEB, OUTPUT_BLOCK_SIZE);
        encryptedSegments.push(await aesCbcEncryptBlockPadded(packageKey, iv, zeroPadToBlock(segment, OUTPUT_BLOCK_SIZE)));
    }
    return concatBytes(encryptedSegments);
}
async function encryptWithPackageKey(packageKey, salt, blockKey, plain) {
    const iv = await deriveIv(salt, blockKey, OUTPUT_HASH_ALGORITHM_WEB, OUTPUT_BLOCK_SIZE);
    return aesCbcEncryptBlockPadded(packageKey, iv, zeroPadToBlock(plain, OUTPUT_BLOCK_SIZE));
}
async function encryptWithPasswordKey(passwordHash, salt, blockKey, plain) {
    const key = await deriveBlockKey(passwordHash, blockKey, OUTPUT_HASH_ALGORITHM_WEB, OUTPUT_KEY_BYTES);
    const iv = deriveIvFromSalt(salt, OUTPUT_BLOCK_SIZE);
    return aesCbcEncryptBlockPadded(key, iv, zeroPadToBlock(plain, OUTPUT_BLOCK_SIZE));
}
//# sourceMappingURL=encrypt.js.map