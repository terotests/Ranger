# arenas/sprites — host sprite entities (to implement)

Long-term home for generation-checked sprite/sheet handles (D-HANDLE / D-OWN),
parallel to `arenas/three/mesh`.

**Staged implementation today:** [`../../../sprites/`](../../../sprites/)
(`game_sprite.rgr`, RGSP1). Rewire into this arena family in Phase 10b.

## Binding decisions

- D-TYPE, D-OWN, D-LIFE
- Legacy RGSP1 block ABI remains until registry commands cover slots/sheets

## Unit / contract tests that gate this folder

- sprite_create_release
- remove_from_list_ne_release_sheet
- rgsp1_header_validation

---

*Scaffold + pointer to staged sprites copy.*
