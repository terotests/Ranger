import { utf8Decode } from "../binary/text.js";
import { ooxmlError } from "../errors.js";
import { normalizeZipPath, ZipReader } from "../zip/reader.js";
export async function readCellA1(input, options = {}) {
    const zip = new ZipReader(input, options.inflateRaw ? { inflateRaw: options.inflateRaw } : {});
    const workbookXml = await readXml(zip, "xl/workbook.xml");
    const relationshipId = findSheetRelationshipId(workbookXml, options.sheetName);
    const relationshipsXml = await readXml(zip, "xl/_rels/workbook.xml.rels");
    const worksheetPath = resolveWorkbookTarget(findRelationshipTarget(relationshipsXml, relationshipId));
    const worksheetXml = await readXml(zip, worksheetPath);
    const cell = findCellA1(worksheetXml);
    if (cell.type === "s") {
        if (!cell.value)
            throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 shared-string index is missing");
        const sharedStringsXml = await readXml(zip, "xl/sharedStrings.xml");
        return readSharedString(sharedStringsXml, cell.value);
    }
    if (cell.type === "inlineStr")
        return readInlineString(cell.body);
    if (cell.type === "str")
        return readValue(cell.body);
    throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 has an unsupported cell type");
}
async function readXml(zip, path) {
    return utf8Decode(await zip.read(path));
}
function findSheetRelationshipId(workbookXml, sheetName) {
    for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?\s*>/gu)) {
        const attributes = parseAttributes(match[1]);
        if (sheetName !== undefined && attributes.get("name") !== sheetName)
            continue;
        const id = attributes.get("r:id") ?? attributes.get("id");
        if (!id)
            break;
        return id;
    }
    const message = sheetName === undefined ? "Workbook has no worksheets" : `Workbook sheet is missing: ${sheetName}`;
    throw ooxmlError("unsupportedWorkbookStructure", message);
}
function findRelationshipTarget(relationshipsXml, relationshipId) {
    for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?\s*>/gu)) {
        const attributes = parseAttributes(match[1]);
        if (attributes.get("Id") === relationshipId) {
            const target = attributes.get("Target");
            if (!target)
                break;
            return target;
        }
    }
    throw ooxmlError("unsupportedWorkbookStructure", `Workbook relationship is missing: ${relationshipId}`);
}
function resolveWorkbookTarget(target) {
    if (target.startsWith("/"))
        return normalizeZipPath(target.slice(1));
    return normalizeZipPath(`xl/${target}`);
}
function findCellA1(worksheetXml) {
    for (const match of worksheetXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/gu)) {
        const attributes = parseAttributes((match[1] ?? match[3]));
        if (attributes.get("r") !== "A1")
            continue;
        const body = match[2] ?? "";
        return { type: attributes.get("t"), value: tryReadValue(body), body };
    }
    throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 is missing");
}
function readSharedString(sharedStringsXml, indexText) {
    const index = Number(indexText);
    if (!Number.isInteger(index) || index < 0)
        throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 has an invalid shared-string index");
    const matches = [...sharedStringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gu)];
    const match = matches[index];
    if (!match)
        throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 shared string is missing");
    return readTextNodes(match[1]);
}
function readInlineString(cellBody) {
    const inline = /<is\b[^>]*>([\s\S]*?)<\/is>/u.exec(cellBody);
    if (!inline)
        throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 inline string is missing");
    return readTextNodes(inline[1]);
}
function readTextNodes(xml) {
    let output = "";
    for (const match of xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gu))
        output += unescapeXml(match[1]);
    if (output === "")
        throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 text is missing");
    return output;
}
function readValue(cellBody) {
    const value = tryReadValue(cellBody);
    if (value === "")
        throw ooxmlError("unsupportedWorkbookStructure", "Sheet!A1 value is missing");
    return value;
}
function tryReadValue(cellBody) {
    const value = /<v\b[^>]*>([\s\S]*?)<\/v>/u.exec(cellBody);
    return value ? unescapeXml(value[1]) : "";
}
function parseAttributes(source) {
    const attributes = new Map();
    const pattern = /([A-Za-z_:][\w:.-]*)="([^"]*)"/gu;
    let match;
    while ((match = pattern.exec(source)))
        attributes.set(match[1], unescapeXml(match[2]));
    return attributes;
}
function unescapeXml(value) {
    return value.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
//# sourceMappingURL=read-cell-a1.js.map