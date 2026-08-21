// The asynchronous half of the DuckDB driver.
//
// DuckDB's Node API is promise based, and a spreadsheet asking for the rows it
// is about to paint cannot await. Rather than making every Ranger caller
// asynchronous - which would mean a Task type Ranger does not have, on an
// `async` keyword only one of its twelve targets emits - the asynchrony is
// confined to this worker thread. The main thread blocks on an Atomics.wait
// and collects the answer with receiveMessageOnPort, which works while the
// event loop is parked.
//
// This is the shape the rest of the library assumes for any engine that is
// async in its host language: Ranger stays synchronous, the host solves
// concurrency where the platform already has an answer for it.

import { workerData } from 'node:worker_threads';

const { signal, port } = workerData;
const state = new Int32Array(signal);

let instance = null;
const connections = new Map();
let nextConn = 1;

function plain(v) {
  if (v === null || v === undefined) { return null; }
  const t = typeof v;
  if (t === 'bigint') {
    if (v <= 9007199254740991n && v >= -9007199254740991n) { return Number(v); }
    return v.toString();
  }
  if (t === 'number' || t === 'boolean' || t === 'string') { return v; }
  return String(v);
}

function kindOfTypeId(id, TypeId) {
  if (id === TypeId.BOOLEAN) { return 'bool'; }
  if (id === TypeId.TINYINT || id === TypeId.SMALLINT || id === TypeId.INTEGER ||
      id === TypeId.BIGINT || id === TypeId.HUGEINT || id === TypeId.UTINYINT ||
      id === TypeId.USMALLINT || id === TypeId.UINTEGER || id === TypeId.UBIGINT) { return 'int'; }
  if (id === TypeId.FLOAT || id === TypeId.DOUBLE || id === TypeId.DECIMAL) { return 'double'; }
  return 'string';
}

function firstKeyword(sql) {
  const m = /^\s*([a-zA-Z]+)/.exec(sql);
  return m ? m[1].toLowerCase() : '';
}

async function handle(msg) {
  const api = await import('@duckdb/node-api');
  const { DuckDBInstance, DuckDBTypeId } = api;
  if (msg.op === 'open') {
    if (!instance) { instance = await DuckDBInstance.create(msg.dsn && msg.dsn.length ? msg.dsn : ':memory:'); }
    const con = await instance.connect();
    const id = nextConn++;
    connections.set(id, con);
    return { conn: id };
  }
  if (msg.op === 'close') {
    const con = connections.get(msg.conn);
    connections.delete(msg.conn);
    if (con && typeof con.closeSync === 'function') { con.closeSync(); }
    return { ok: true };
  }
  if (msg.op !== 'exec') { return { error: 'unknown op ' + msg.op }; }
  const con = connections.get(msg.conn);
  if (!con) { return { error: 'no such connection' }; }
  const kw = firstKeyword(msg.sql);
  const returnsRows = (kw === 'select' || kw === 'with' || kw === 'describe' || kw === 'show' ||
                       kw === 'pragma' || kw === 'values' || kw === 'explain' || kw === 'from');
  const params = msg.params && msg.params.length ? msg.params : undefined;
  if (!returnsRows) {
    const result = await con.run(msg.sql, params);
    let changed = 0;
    try { changed = Number(result.rowsChanged); } catch (e) { changed = 0; }
    if (!Number.isFinite(changed)) { changed = 0; }
    return { affected: changed };
  }
  const reader = await con.runAndReadAll(msg.sql, params);
  const names = reader.columnNames();
  const types = reader.columnTypes();
  const columns = names.map((name, i) => ({ name, kind: kindOfTypeId(types[i].typeId, DuckDBTypeId) }));
  const rows = reader.getRows().map((row) => row.map(plain));
  return { columns, rows };
}

port.on('message', (msg) => {
  handle(msg).then((reply) => {
    port.postMessage(reply);
    Atomics.store(state, 0, 1);
    Atomics.notify(state, 0);
  }).catch((e) => {
    port.postMessage({ error: (e && e.message) ? e.message : String(e) });
    Atomics.store(state, 0, 1);
    Atomics.notify(state, 0);
  });
});
