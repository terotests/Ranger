export class OoxmlEncryptionError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "OoxmlEncryptionError";
        this.code = code;
    }
}
export function ooxmlError(code, message) {
    return new OoxmlEncryptionError(code, message);
}
//# sourceMappingURL=errors.js.map