'use strict';
// The host side of HostSql.rgr: four calls, a driver registry, and no
// knowledge of what any of the SQL means.
//
//   available(driver)            is the engine installed here?
//   open(driver, dsn)  -> handle
//   exec(handle, sql, argsWire) -> RDBW1 text, or "ERR<TAB>message"
//   close(handle)
//
// Adding an engine is a file in this directory and a line in DRIVERS.

const wire = require('./wire.cjs');

const DRIVERS = {
  sqlite: () => require('./driver_sqlite.cjs'),
  duckdb: () => require('./driver_duckdb.cjs'),
};

const open_handles = new Map();
let nextHandle = 1;

function driverFor(name) {
  const load = DRIVERS[name];
  if (!load) { return null; }
  try { return load(); } catch (e) { return null; }
}

function available(driver) {
  const d = driverFor(driver);
  if (!d) { return false; }
  try { return d.available(); } catch (e) { return false; }
}

function open(driver, dsn) {
  const d = driverFor(driver);
  if (!d) { return -1; }
  try {
    const conn = d.open(dsn);
    const handle = nextHandle++;
    open_handles.set(handle, { driver: d, name: driver, conn });
    return handle;
  } catch (e) {
    return -1;
  }
}

function exec(handle, sql, argsWire) {
  const entry = open_handles.get(handle);
  if (!entry) { return wire.errorText('no such connection: ' + handle); }
  let params = [];
  try { params = wire.decodeParams(argsWire); } catch (e) { return wire.errorText(e && e.message); }
  try {
    return entry.driver.exec(entry.conn, sql, params);
  } catch (e) {
    return wire.errorText((e && e.message ? e.message : e) + ' [' + sql + ']');
  }
}

function close(handle) {
  const entry = open_handles.get(handle);
  if (!entry) { return; }
  open_handles.delete(handle);
  try { entry.driver.close(entry.conn); } catch (e) { /* nothing to do */ }
}

module.exports = { available, open, exec, close };
