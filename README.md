# Forge a Nation V7.11

## City rendering provenance
The 3D city massing uses a modernized, deterministic adaptation of the MIT-licensed THREEx.ProceduralCity approach by Jerome Etienne, originally based on mrdoob's Three.js city demo.

Source: https://github.com/jeromeetienne/threex.proceduralcity
License: MIT

The implementation has been adapted for modern Three.js and Forge a Nation's progression system; no proprietary ThreeUI assets are included.

Kenney also provides CC0 City Kit assets (Suburban, Industrial, Roads, etc.) that are suitable for future modular asset expansion:
https://kenney.nl/assets/city-kit-suburban
https://kenney.nl/assets/city-kit-industrial


## Kenney City Kit integration
The city renderer now uses real Kenney City Kit GLB assets at runtime, including City Kit (Suburban) building models and City Kit (Roads) tiles. Kenney publishes these packs under CC0, so they can be used in personal or commercial projects. The game keeps its procedural city layer as a fallback and for progression/landmark dressing.

Official sources:
- https://kenney.nl/assets/city-kit-suburban
- https://kenney.nl/assets/city-kit-roads
- https://kenney.nl/support
