# Local spline library

Default on-disk store for the Vite mesh editor. **Not IndexedDB** — plain
folders + JSON so you can optionally put a *copy* under version control.

```text
library/
  projects/
    <slug>/
      project.json     # schemaVersioned document (ranger.splineProject)
      assets/          # optional texture files (future)
```

## Location

Default root (relative to this folder):

```text
gallery/game_engine/v2/mesh_editor/library/projects
```

Override when starting Vite:

```bash
MESH_EDITOR_LIBRARY=/path/to/my-splines npm run dev
```

`projects/*` contents are **gitignored** by default. To version a curated set,
copy or symlink selected folders into a tracked tree, or temporarily force-add.

## Schema

- Kind: `ranger.splineProject`
- Current version: see `app/src/library/schema.js` (`CURRENT_SCHEMA_VERSION`)
- Migrations: `app/src/library/migrations.js` — every load upgrades to current
- v2 adds a closed `orbit` Bezier path (unit circle by default) alongside `profile`
- v3 adds `assetGuid`, `objectMaterial`, `embeddedAssets`, and `children` (sub-object instances)
- v4 adds per-segment `pathType` (`bezier` \| `line` \| `arc`) and optional `arcBulge`
- v5 adds `spineProfile` + `spineOrbit` open paths (signed lateral offset vs height) that
  curve the lathe centerline; default is a straight vertical line (`pathType: line`)
- v6 adds `placementNormal` `{ start:{x,y}, end:{x,y} }` — object “up” segment for
  preview orientation and future assembly (default `(0,-1)→(0,1)`)
- v7 adds `editor.tessellationMode`: `rotation` (classic lathe) or `torus` (profile
  swept along orbit as a unit-sized ring)
- v8 extends child `transform` with optional surface placement (`z`, `nx/ny/nz`,
  `surface`) for 3D preview raycast attach

When you change the document shape, bump the version and add a step; old folders
keep working.
