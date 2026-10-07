# Forge a Nation V7.6

Targeted V7.6 polish pass:
- Mobile bottom navigation is explicitly horizontal/touch-pan-x.
- Development Store uses the same custom scrollbar treatment as the rest of the UI.
- 100 city map SVG variants are assigned from a per-player shuffled pool.
- Existing saves receive unique city maps on migration.
- Continue Playing collects pending away earnings and returns to the Home dashboard.
- Hero metric cards use a fixed 2x2 mobile grid with controlled typography and dimensions.
- PC dashboard visual structure is preserved.

Testing:
- `node --check src/main.js` passes.
- 100 city SVG assets verified present.
- ZIP integrity verified after packaging.
