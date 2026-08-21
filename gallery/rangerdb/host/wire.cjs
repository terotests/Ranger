'use strict';
// RDBW1 - the same rectangle DbWire.rgr reads and writes.
//
//   RDBW1
//   <name>
//   <colCount> TAB <rowCount>
//   <colName> TAB <kind> TAB <isKey>     x colCount
//   <v> TAB <v> ...                      x rowCount
//
// Backslash escapes itself, \t and \n are the two characters that would
// otherwise end a field or a row, and \N is NULL.

const TAB = '\t';
const NL = '\n';

function escape(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') { out += '\\\\'; }
    else if (c === '\t') { out += '\\t'; }
    else if (c === '\n') { out += '\\n'; }
    else if (c === '\r') { out += '\\r'; }
    else { out += c; }
  }
  return out;
}

function unescape(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && i + 1 < s.length) {
      const d = s[i + 1];
      if (d === 't') { out += '\t'; }
      else if (d === 'n') { out += '\n'; }
      else if (d === 'r') { out += '\r'; }
      else if (d === '\\') { out += '\\'; }
      i++;
    } else {
      out += s[i];
    }
  }
  return out;
}

// Every value crosses the seam as text; the column's kind says what the text
// means. `toText` is the one place a host value type (BigInt, a DuckDB date,
// a Buffer) is turned into that text.
function toText(v) {
  if (typeof v === 'string') { return v; }
  if (typeof v === 'boolean') { return v ? 'true' : 'false'; }
  if (typeof v === 'bigint') { return v.toString(); }
  if (typeof v === 'number') { return String(v); }
  if (v === undefined || v === null) { return ''; }
  if (typeof v === 'object' && typeof v.toString === 'function') { return v.toString(); }
  return String(v);
}

function encode(name, columns, rows) {
  const lines = ['RDBW1', escape(name), columns.length + TAB + rows.length];
  for (const c of columns) {
    lines.push(escape(c.name) + TAB + (c.kind || 'string') + TAB + (c.key ? '1' : '0'));
  }
  for (const row of rows) {
    const cells = [];
    for (let i = 0; i < columns.length; i++) {
      const v = row[i];
      cells.push(v === null || v === undefined ? '\\N' : escape(toText(v)));
    }
    lines.push(cells.join(TAB));
  }
  return lines.join(NL);
}

// Decode a parameter chunk: one row of typed values, as JS values.
function decodeParams(text) {
  if (!text || text.indexOf('RDBW1') !== 0) { return []; }
  const lines = text.split(NL);
  const counts = (lines[2] || '').split(TAB);
  const colCount = parseInt(counts[0], 10) || 0;
  const rowCount = parseInt(counts[1], 10) || 0;
  if (colCount === 0 || rowCount === 0) { return []; }
  const kinds = [];
  for (let i = 0; i < colCount; i++) {
    const parts = (lines[3 + i] || '').split(TAB);
    kinds.push(parts[1] || 'string');
  }
  const cells = (lines[3 + colCount] || '').split(TAB);
  const out = [];
  for (let i = 0; i < colCount; i++) {
    const raw = cells[i];
    if (raw === '\\N' || raw === undefined) { out.push(null); continue; }
    const text2 = unescape(raw);
    const kind = kinds[i];
    if (kind === 'int') { out.push(parseInt(text2, 10)); }
    else if (kind === 'double' || kind === 'date' || kind === 'timestamp') { out.push(parseFloat(text2)); }
    else if (kind === 'bool') { out.push(text2 === 'true' || text2 === '1'); }
    else { out.push(text2); }
  }
  return out;
}

function errorText(message) {
  return 'ERR' + TAB + String(message).split('\n').join(' ');
}

// A result that is only "n rows changed".
function affectedChunk(n) {
  return encode('result', [{ name: 'rdb_affected', kind: 'int' }], [[n]]);
}

module.exports = { encode, decodeParams, escape, unescape, toText, errorText, affectedChunk };
