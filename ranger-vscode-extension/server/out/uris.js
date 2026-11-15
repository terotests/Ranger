"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URI_TO_PATH = URI_TO_PATH;
exports.PATH_TO_URI = PATH_TO_URI;
/** file:// URIs to paths and back, without pulling in vscode-uri. */
const url_1 = require("url");
function URI_TO_PATH(uri) {
    if (!uri.startsWith("file:"))
        return null;
    try {
        return (0, url_1.fileURLToPath)(uri);
    }
    catch {
        return null;
    }
}
function PATH_TO_URI(file) {
    return (0, url_1.pathToFileURL)(file).toString();
}
//# sourceMappingURL=uris.js.map