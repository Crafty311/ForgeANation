# Forge a Nation V7.12 — Kenney City Overhaul

## City rendering
The old placeholder/procedural building and tree library has been removed from the active city renderer.

Cities now use a district-based Kenney-first layout:
- City Kit (Suburban): sparse residential neighborhoods
- City Kit (Commercial): compact downtown/commercial core
- City Kit (Industrial): separated industrial edge
- City Kit (Roads): readable road network
- Nature Kit: parks, trees, rocks and green corridors

The renderer deliberately leaves substantial open land and plaza space. Density increases with city progression instead of filling the entire map at every level.

Models are loaded at runtime from HidenCod's public Kenney CC0 model library, which documents the packs as Kenney assets under CC0:
https://github.com/Hidencod/tge-assets

Official Kenney sources:
https://kenney.nl/assets/city-kit-suburban
https://kenney.nl/assets/city-kit-commercial
https://kenney.nl/assets/city-kit-industrial
https://kenney.nl/assets/city-kit-roads
https://kenney.nl/assets/nature-kit
https://kenney.nl/assets/building-kit
https://kenney.nl/assets/retro-urban-kit

## Important
Building Kit and Retro Urban Kit are documented in the README as candidate future district packs, but they are not falsely claimed as runtime-integrated in this build because the public runtime catalog used here does not expose those two packs. The active renderer only loads assets that can be resolved from the runtime catalog.

No proprietary ThreeUI assets are included.


# V8.0 — Cozy Nation
Adds daily Little Things moments, city selection, local projects that persist into city visuals, ambient citizens, city-specific growth, daily streaks, and a more approachable life-sim loop. V7.13/V7.14 city and national-map foundations are preserved.
