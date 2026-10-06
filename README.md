# Forge a Nation — V5.4

V5.4 expands the V5.3 simulation without replacing its map/UI foundation.

## Simulation
- Economic sectors, treasury, tax pressure and public spending
- Demographic/social groups with different reactions to policy
- City specialization and city-level investment projects
- Trade balance and neighbor relationships
- Military capability and deterrence
- Persistent events with player responses and consequences
- Richer national history and progression XP
- Reactive 3D spatial data field around the existing nation map

## 3D / UI
- Three.js post-processing bloom
- Procedural orbital metric rings and data nodes
- Spatial HUD labels for population/economy/military layers
- Existing city/building world preserved
- Navigation updates the active content state without a browser-style page refresh

## Deployment
The Vercel build script invokes Vite through Node directly, avoiding executable-bit issues with `node_modules/.bin/vite` in restricted build environments.

## Landing visual reference
The start-page globe is a native Three.js implementation inspired by ThreeUI's "Globe — Network Globe" visual language (dotted globe, routes, glow, interaction). The existing game-world renderer is unchanged. Reference: https://threeui.com/backgrounds/
