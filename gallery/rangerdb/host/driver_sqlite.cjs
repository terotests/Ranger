'use strict';
// SQLite through node:sqlite - the built-in, and the reason the second engine
// costs nothing to try: no install, and its API is already synchronous, so
// there is no bridge between it and a Ranger program that wants an answer now.

const wire = require('./wire.cjs');

function available() {
  try { require('node:sqlite'); return true; } catch (e) { return false; }
}

function open(dsn) {
  const { DatabaseSync } = require('node:sqlite');
  return new DatabaseSync(dsn && dsn.length ? dsn : ':memory:');
}

function close(db) {
  try { db.close(); } catch (e) { /* already closed */ }
}

function firstKeyword(sql) {
  const m = /^\s*([a-zA-Z]+)/.exec(sql);
  return m ? m[1].toLowerCase() : '';
}

// SQLite's declared type is a string the table was created with, and for an
// expression there is none - so a column with no declared type is typed from
// the first value that arrives, and a query that returned nothing is text.
function kindOfDeclared(type) {
  if (!type) { return null; }
  const t = String(type).toUpperCase();
  if (t.indexOf('BOOL') >= 0) { return 'bool'; }
  if (t.indexOf('INT') >= 0) { return 'int'; }
  if (t.indexOf('CHAR') >= 0 || t.indexOf('TEXT') >= 0 || t.indexOf('CLOB') >= 0 || t.indexOf('STRING') >= 0) { return 'string'; }
  if (t.indexOf('REAL') >= 0 || t.indexOf('DOUB') >= 0 || t.indexOf('FLOA') >= 0 || t.indexOf('NUM') >= 0 || t.indexOf('DEC') >= 0) { return 'double'; }
  if (t.indexOf('DATE') >= 0 || t.indexOf('TIME') >= 0) { return 'string'; }
  return null;
}

function kindOfValue(v) {
  if (typeof v === 'bigint') { return 'int'; }
  if (typeof v === 'boolean') { return 'bool'; }
  if (typeof v === 'number') { return Number.isInteger(v) ? 'int' : 'double'; }
  return 'string';
}

// A boolean is not a SQLite value; it is a 1 or a 0.
function bindable(v) {
  if (typeof v === 'boolean') { return v ? 1 : 0; }
  return v;
}

function exec(db, sql, params) {
  const kw = firstKeyword(sql);
  if (kw === 'begin' || kw === 'commit' || kw === 'rollback') {
    db.exec(sql);
    return wire.affectedChunk(0);
  }
  const stmt = db.prepare(sql);
  const bound = params.map(bindable);
  const returnsRows = (kw === 'select' || kw === 'with' || kw === 'pragma' || kw === 'values' || kw === 'explain');
  if (!returnsRows) {
    const r = stmt.run(...bound);
    return wire.affectedChunk(r.changes);
  }
  const rows = stmt.all(...bound);
  const declared = stmt.columns();
  const columns = declared.map((c) => ({ name: c.name, kind: kindOfDeclared(c.type) }));
  for (const col of columns) {
    if (col.kind) { continue; }
    let kind = 'string';
    for (const row of rows) {
      const v = row[col.name];
      if (v !== null && v !== undefined) { kind = kindOfValue(v); break; }
    }
    col.kind = kind;
  }
  const table = rows.map((row) => columns.map((c) => {
    const v = row[c.name];
    return v === undefined ? null : v;
  }));
  return wire.encode('result', columns, table);
}

module.exports = { available, open, close, exec };
