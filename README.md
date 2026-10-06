# Forge a Nation V6 — Simulation Core

V6 keeps the V5.6 visual foundation and landing globe, but replaces the click-only progression with a real turn-based nation simulation.

## Core loop

Observe pressure → spend limited government actions → commit resources → advance the year → resolve consequences → adapt.

### New simulation systems
- 3 government actions per year
- Real treasury costs and fiscal balance
- Multi-year construction projects
- Supply pressure for food, water, energy and housing
- Inflation and cost-of-living pressure
- Employment and urbanization feedback
- Political group support
- Emerging crises based on actual national conditions
- Crisis response choices with real trade-offs
- Trade and diplomatic action costs
- City investment costs and action limits
- Rail, megaproject, energy, culture, museum and festival decisions are implemented
- Persistent project/history/news records
- V6 save format with fallback migration from the previous save

## Preserved
- Landing-page ThreeUI-inspired matrix globe
- Nation creator
- Existing 3D world/map
- Existing navigation and visual system
- No multiplayer changes

## Verification
- `node --check src/main.js` passes.
- ZIP integrity checked after packaging.
- Full Vite browser build was not run in this environment because dependencies are not installed here.
