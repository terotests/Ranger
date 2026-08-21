'use strict';
// DuckDB, made synchronous. See duckdb_worker.mjs for why the worker exists.
//
// Everything here is bookkeeping: start the worker once, send it a message,
// block until it answers, and turn the answer into the same RDBW1 rectangle
// the SQLite driver produces. Nothing about DuckDB reaches the Ranger side.

const path = require('node:path');
const wire = require('./wire.cjs');

let bridge = null;

function available() {
  try { require.resolve('@duckdb/node-api'); return true; } catch (e) { return false; }
}

function startBridge() {
  if (bridge) { return bridge; }
  const { Worker, MessageChannel } = require('node:worker_threads');
  const signal = new SharedArrayBuffer(4);
  const channel = new MessageChannel();
  const worker = new Worker(path.join(__dirname, 'duckdb_worker.mjs'), {
    workerData: { signal, port: channel.port2 },
    transferList: [channel.port2],
  });
  // The bridge must not be what keeps the process alive.
  worker.unref();
  channel.port1.unref();
  bridge = { worker, port: channel.port1, state: new Int32Array(signal) };
  return bridge;
}

function call(msg) {
  const b = startBridge();
  const { receiveMessageOnPort } = require('node:worker_threads');
  Atomics.store(b.state, 0, 0);
  b.port.postMessage(msg);
  // Blocks this thread; the worker is free to run its promises.
  Atomics.wait(b.state, 0, 0);
  const reply = receiveMessageOnPort(b.port);
  if (!reply) { throw new Error('duckdb bridge produced no answer'); }
  if (reply.message && reply.message.error) { throw new Error(reply.message.error); }
  return reply.message;
}

function open(dsn) {
  const reply = call({ op: 'open', dsn });
  return { conn: reply.conn };
}

function close(handle) {
  try { call({ op: 'close', conn: handle.conn }); } catch (e) { /* going away anyway */ }
}

function exec(handle, sql, params) {
  const reply = call({ op: 'exec', conn: handle.conn, sql, params });
  if (reply.columns) { return wire.encode('result', reply.columns, reply.rows); }
  return wire.affectedChunk(reply.affected || 0);
}

module.exports = { available, open, close, exec };
