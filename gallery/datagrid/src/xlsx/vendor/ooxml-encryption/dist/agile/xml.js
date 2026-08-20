import { readUInt16LE, readUInt32LE, writeUInt16LE, writeUInt32LE } from "../binary/bytes.js";
import { decodeBase64, encodeBase64 } from "../binary/base64.js";
import { utf8Decode, utf8Encode } from "../binary/text.js";
import { ooxmlError } from "../errors.js";
import { AGILE_FLAGS, AGILE_VERSION_MAJOR, AGILE_VERSION_MINOR, hashSizeForWeb, hashXmlToWeb } from "./constants.js";
export function parseEncryptionInfo(bytes) {
    if (bytes.length < 8)
        throw ooxmlError("unsupportedEncryptionType", "EncryptionInfo stream is too short");
    const major = readUInt16LE(bytes, 0);
    const minor = readUInt16LE(bytes, 2);
    if (major !== AGILE_VERSION_MAJOR || minor !== AGILE_VERSION_MINOR) {
        throw ooxmlError("unsupportedEncryptionType", `Unsupported encryption type: version ${major}.${minor}`);
    }
    const flags = readUInt32LE(bytes, 4);
    if (flags !== AGILE_FLAGS)
        throw ooxmlError("unsupportedEncryptionType", "EncryptionInfo is not Agile Encryption");
    const xml = readEncryptionXml(bytes);
    const keyData = parseKeyData(parseTagAttributes(xml, "keyData"));
    const dataIntegrity = parseDataIntegrity(parseTagAttributes(xml, "dataIntegrity"));
    const passwordKey = parsePasswordKey(parseTagAttributes(xml, "encryptedKey"));
    validateKeyData(keyData);
    validatePasswordKey(passwordKey);
    return { keyData, dataIntegrity, passwordKey };
}
export function serializeEncryptionInfo(info) {
    const xmlBytes = utf8Encode(writeEncryptionXml(info));
    const output = new Uint8Array(8 + xmlBytes.length);
    writeUInt16LE(output, 0, AGILE_VERSION_MAJOR);
    writeUInt16LE(output, 2, AGILE_VERSION_MINOR);
    writeUInt32LE(output, 4, AGILE_FLAGS);
    output.set(xmlBytes, 8);
    return output;
}
function readEncryptionXml(bytes) {
    let start = 8;
    let length = bytes.length - 8;
    if (bytes.length >= 12) {
        const declaredLength = readUInt32LE(bytes, 8);
        if (declaredLength > 0 && 12 + declaredLength <= bytes.length && bytes[12] === 0x3c) {
            start = 12;
            length = declaredLength;
        }
    }
    let xml = utf8Decode(bytes.slice(start, start + length));
    const end = xml.lastIndexOf(">");
    if (end >= 0)
        xml = xml.slice(0, end + 1);
    return xml;
}
function writeEncryptionXml(info) {
    const keyData = info.keyData;
    const passwordKey = info.passwordKey;
    return [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<encryption xmlns="http://schemas.microsoft.com/office/2006/encryption" xmlns:p="http://schemas.microsoft.com/office/2006/keyEncryptor/password">',
        `<keyData saltSize="${keyData.saltSize}" blockSize="${keyData.blockSize}" keyBits="${keyData.keyBits}" hashSize="${keyData.hashSize}" cipherAlgorithm="${keyData.cipherAlgorithm}" cipherChaining="${keyData.cipherChaining}" hashAlgorithm="${keyData.hashAlgorithm}" saltValue="${encodeBase64(keyData.saltValue)}"/>`,
        `<dataIntegrity encryptedHmacKey="${encodeBase64(info.dataIntegrity.encryptedHmacKey)}" encryptedHmacValue="${encodeBase64(info.dataIntegrity.encryptedHmacValue)}"/>`,
        '<keyEncryptors>',
        '<keyEncryptor uri="http://schemas.microsoft.com/office/2006/keyEncryptor/password">',
        `<p:encryptedKey spinCount="${passwordKey.spinCount}" saltSize="${passwordKey.saltSize}" blockSize="${passwordKey.blockSize}" keyBits="${passwordKey.keyBits}" hashSize="${passwordKey.hashSize}" cipherAlgorithm="${passwordKey.cipherAlgorithm}" cipherChaining="${passwordKey.cipherChaining}" hashAlgorithm="${passwordKey.hashAlgorithm}" saltValue="${encodeBase64(passwordKey.saltValue)}" encryptedVerifierHashInput="${encodeBase64(passwordKey.encryptedVerifierHashInput)}" encryptedVerifierHashValue="${encodeBase64(passwordKey.encryptedVerifierHashValue)}" encryptedKeyValue="${encodeBase64(passwordKey.encryptedKeyValue)}"/>`,
        '</keyEncryptor>',
        '</keyEncryptors>',
        '</encryption>',
    ].join("");
}
function parseKeyData(attributes) {
    return {
        saltSize: requiredInt(attributes, "saltSize"),
        blockSize: requiredInt(attributes, "blockSize"),
        keyBits: requiredInt(attributes, "keyBits"),
        hashSize: requiredInt(attributes, "hashSize"),
        cipherAlgorithm: requiredLiteral(attributes, "cipherAlgorithm", "AES"),
        cipherChaining: requiredLiteral(attributes, "cipherChaining", "ChainingModeCBC"),
        hashAlgorithm: requiredHash(attributes, "hashAlgorithm"),
        saltValue: requiredBase64(attributes, "saltValue"),
    };
}
function parseDataIntegrity(attributes) {
    return {
        encryptedHmacKey: requiredBase64(attributes, "encryptedHmacKey"),
        encryptedHmacValue: requiredBase64(attributes, "encryptedHmacValue"),
    };
}
function parsePasswordKey(attributes) {
    return {
        spinCount: requiredInt(attributes, "spinCount"),
        saltSize: requiredInt(attributes, "saltSize"),
        blockSize: requiredInt(attributes, "blockSize"),
        keyBits: requiredInt(attributes, "keyBits"),
        hashSize: requiredInt(attributes, "hashSize"),
        cipherAlgorithm: requiredLiteral(attributes, "cipherAlgorithm", "AES"),
        cipherChaining: requiredLiteral(attributes, "cipherChaining", "ChainingModeCBC"),
        hashAlgorithm: requiredHash(attributes, "hashAlgorithm"),
        saltValue: requiredBase64(attributes, "saltValue"),
        encryptedVerifierHashInput: requiredBase64(attributes, "encryptedVerifierHashInput"),
        encryptedVerifierHashValue: requiredBase64(attributes, "encryptedVerifierHashValue"),
        encryptedKeyValue: requiredBase64(attributes, "encryptedKeyValue"),
    };
}
function validateKeyData(keyData) {
    validateAlgorithmShape(keyData.blockSize, keyData.keyBits, keyData.hashSize, keyData.hashAlgorithm);
    if (keyData.saltValue.length !== keyData.saltSize)
        throw unsupported("keyData salt length does not match saltSize");
}
function validatePasswordKey(passwordKey) {
    validateAlgorithmShape(passwordKey.blockSize, passwordKey.keyBits, passwordKey.hashSize, passwordKey.hashAlgorithm);
    if (passwordKey.saltValue.length !== passwordKey.saltSize)
        throw unsupported("password salt length does not match saltSize");
}
function validateAlgorithmShape(blockSize, keyBits, hashSize, hashAlgorithm) {
    if (blockSize !== 16)
        throw unsupported("Only 16-byte AES blocks are supported");
    if (![128, 192, 256].includes(keyBits))
        throw unsupported(`Unsupported AES key size: ${keyBits}`);
    const webHash = hashXmlToWeb(hashAlgorithm);
    if (hashSize !== hashSizeForWeb(webHash))
        throw unsupported("hashSize does not match hashAlgorithm");
}
function parseTagAttributes(xml, localName) {
    const tag = new RegExp(`<(?:[A-Za-z_][\\w.-]*:)?${localName}\\b([^>]*)>`, "u").exec(xml);
    if (!tag)
        throw ooxmlError("unsupportedAgileParameters", `Missing Agile XML element: ${localName}`);
    return parseAttributes(tag[1]);
}
function parseAttributes(source) {
    const attributes = new Map();
    const pattern = /([A-Za-z_:][\w:.-]*)="([^"]*)"/gu;
    let match;
    while ((match = pattern.exec(source)))
        attributes.set(match[1], unescapeXml(match[2]));
    return attributes;
}
function requiredInt(attributes, name) {
    const value = required(attributes, name);
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0)
        throw unsupported(`Invalid integer Agile XML attribute: ${name}`);
    return parsed;
}
function requiredBase64(attributes, name) {
    return decodeBase64(required(attributes, name));
}
function requiredHash(attributes, name) {
    const value = required(attributes, name).toUpperCase();
    if (value === "SHA1" || value === "SHA256" || value === "SHA384" || value === "SHA512")
        return value;
    throw unsupported(`Unsupported hash algorithm: ${value}`);
}
function requiredLiteral(attributes, name, expected) {
    const value = required(attributes, name);
    if (value !== expected)
        throw unsupported(`Unsupported ${name}: ${value}`);
    return expected;
}
function required(attributes, name) {
    const value = attributes.get(name);
    if (value === undefined)
        throw ooxmlError("unsupportedAgileParameters", `Missing Agile XML attribute: ${name}`);
    return value;
}
function unsupported(message) {
    throw ooxmlError("unsupportedAgileParameters", message);
}
function unescapeXml(value) {
    return value.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
//# sourceMappingURL=xml.js.map