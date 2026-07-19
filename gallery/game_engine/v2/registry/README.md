# registry — single schema source of truth

Authoritative class/command schema that generates every public surface.

**Plan phase:** 3 — see [`CODE_CLEANUP_PLAN.md`](../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-REGISTRY ID immutability (golden ids / tombstones)
- D-REGISTRY
- D-WASM
- D-ADAPTER
- D-MODULES

## To implement

- YAML/JSON (or Ranger) schema for classes, properties, methods, ABI lowering
- Generators under codegen/ emit host, adapter, WASM, TS, Rust

## Unit / contract tests that gate this folder

- fixtures: schema samples compile to stable command name/id tables
- codegen drift test: public command names change only with version bump

---

*Scaffold only (Phase 0). Implementation arrives in later phases.*

---

## Progress — Phase 3 (D-REGISTRY) ✅ green

- `schema/RgSchema.rgr` — class/property/method model. Every property declares
  residency (`guest`/`host`/`hybrid`), ownership, mutability, and a sync boundary;
  `validate()` flags any host/hybrid property that leaves the sync boundary
  `unspecified`. Every method carries an immutable `methodId` + stable
  `wasmExport` name.
- `codegen/RgCodegen.rgr` — stub generators: `hostCommandNames`,
  `wasmImportNames`, `adapterCommandIds` all derive from one schema (index-
  aligned). `checkGolden` enforces D-REGISTRY ID immutability: meaning-change,
  renumber, tombstone-reuse, and lowering-change all fail; new ids are allowed.
- `fixtures/three_schema_fixture.rgr` — Mesh/Geometry/Material sample + the
  published golden id table (with one retired tombstone, id 199).

**Gates (all green):** `schema/tests/schema_validation_test` (5),
`codegen/tests/codegen_parity_test` (13), `codegen/tests/golden_id_test` (11).
Run via `bash ../tests/run.sh`.
