# Forge a Nation — V2.15.1

## City renderer replacement
The city-facing 3D renderer now uses a fixed isometric, grid-based city presentation inspired by cozy mobile builders.

- Kenney City Kit / Starter Kit buildings, roads, nature and Mini Characters remain bundled and are used directly.
- Roads use deterministic 1×1 Kenney tiles with intersections at exact grid crossings.
- City blocks are explicit gaps between roads; player lots sit inside those blocks.
- Background buildings and trees are kept inside block bounds and are cleared away from reserved player lots.
- Player-built buildings are fitted to bounded footprints so their meshes cannot spill onto road tiles.
- Kenney citizens move continuously along road lines with delta-time movement and a subtle walk bob.
- The city camera is orthographic/isometric with pan and zoom rather than free 3D rotation.

The national map renderer remains separate from this city renderer.
