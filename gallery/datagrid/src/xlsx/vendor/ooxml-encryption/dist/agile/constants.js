export const AGILE_VERSION_MAJOR = 4;
export const AGILE_VERSION_MINOR = 4;
export const AGILE_FLAGS = 0x40;
export const AGILE_PACKAGE_SEGMENT_SIZE = 4096;
export const OUTPUT_KEY_BITS = 256;
export const OUTPUT_KEY_BYTES = 32;
export const OUTPUT_BLOCK_SIZE = 16;
export const OUTPUT_SALT_SIZE = 16;
export const OUTPUT_SPIN_COUNT = 100_000;
export const OUTPUT_HASH_ALGORITHM_XML = "SHA512";
export const OUTPUT_HASH_ALGORITHM_WEB = "SHA-512";
export const OUTPUT_HASH_SIZE = 64;
export const BLOCK_KEYS = {
    encryptedVerifierHashInput: Uint8Array.from([0xfe, 0xa7, 0xd2, 0x76, 0x3b, 0x4b, 0x9e, 0x79]),
    encryptedVerifierHashValue: Uint8Array.from([0xd7, 0xaa, 0x0f, 0x6d, 0x30, 0x61, 0x34, 0x4e]),
    encryptedKeyValue: Uint8Array.from([0x14, 0x6e, 0x0b, 0xe7, 0xab, 0xac, 0xd0, 0xd6]),
    encryptedHmacKey: Uint8Array.from([0x5f, 0xb2, 0xad, 0x01, 0x0c, 0xb9, 0xe1, 0xf6]),
    encryptedHmacValue: Uint8Array.from([0xa0, 0x67, 0x7f, 0x02, 0xb2, 0x2c, 0x84, 0x33]),
};
export function hashXmlToWeb(name) {
    switch (name.toUpperCase()) {
        case "SHA1":
            return "SHA-1";
        case "SHA256":
            return "SHA-256";
        case "SHA384":
            return "SHA-384";
        case "SHA512":
            return "SHA-512";
        default:
            throw new Error(`Unsupported hash algorithm: ${name}`);
    }
}
export function hashSizeForWeb(name) {
    switch (name) {
        case "SHA-1":
            return 20;
        case "SHA-256":
            return 32;
        case "SHA-384":
            return 48;
        case "SHA-512":
            return 64;
    }
}
//# sourceMappingURL=constants.js.map