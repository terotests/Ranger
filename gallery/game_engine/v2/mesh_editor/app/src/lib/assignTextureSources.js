// ============================================================================
// assignTextureSources.js — options for the Assign eye-texture dropdown.
// ============================================================================

/**
 * Build dropdown rows: saved texture-library projects first, then editor-only assets.
 * Library rows are never hidden just because the same guid is open in the editor.
 *
 * @param {Array<{ assetGuid?: string, name?: string }>} loadedTextures
 * @param {Array<{
 *   error?: string,
 *   projectKind?: string,
 *   slug?: string,
 *   name?: string,
 *   textureCount?: number,
 *   textures?: Array<{ assetGuid?: string, name?: string }>
 * }>} libraryProjects
 * @returns {Array<{ key: string, label: string, kind: string, guid: string|null, slug: string|null }>}
 */
export function buildAssignTextureSources(loadedTextures, libraryProjects) {
  const rows = [];
  const seenGuid = new Set();
  const seenKey = new Set();

  for (const p of libraryProjects || []) {
    if (p?.error) continue;
    if (p.projectKind && p.projectKind !== "texture") continue;
    const texList = Array.isArray(p.textures) ? p.textures : [];
    let added = 0;
    for (const t of texList) {
      const guid = t?.assetGuid ? String(t.assetGuid) : "";
      const key = guid ? `lib:${p.slug}:${guid}` : `lib:${p.slug}:`;
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      rows.push({
        key,
        label: `${t?.name || "Texture"} · ${p.name || p.slug}`,
        kind: "library",
        guid: guid || null,
        slug: p.slug || null,
      });
      if (guid) seenGuid.add(guid);
      added += 1;
    }
    if (!added && (p.projectKind === "texture" || (p.textureCount || 0) > 0)) {
      const key = `lib:${p.slug}:`;
      if (!seenKey.has(key)) {
        seenKey.add(key);
        const texN = p.textureCount || 0;
        rows.push({
          key,
          label: `${p.name || p.slug}${texN ? ` · ${texN} tex` : ""} (saved)`,
          kind: "library",
          guid: null,
          slug: p.slug || null,
        });
      }
    }
  }

  for (const t of loadedTextures || []) {
    const guid = t?.assetGuid ? String(t.assetGuid) : "";
    if (!guid || seenGuid.has(guid)) continue;
    seenGuid.add(guid);
    const key = `loaded:${guid}`;
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    rows.push({
      key,
      label: `${t.name || "Texture"} (open · ${guid.slice(0, 8)}…)`,
      kind: "loaded",
      guid,
      slug: null,
    });
  }
  return rows;
}
