# Forge a Nation — V2.15.0.4

Foundation and simulation pass.

- Five seasons, five days each, 25 days per game year.
- One real-world day away advances one game day on login/return and credits that day's simulated national income automatically.
- Versioned localStorage saves with a primary save and backup slot; legacy saves are migrated without using `window.name`.
- Nation Level is derived from the highest City Level.
- Daily economy, population, city output, progression, city lots and national infrastructure are calculated from live state.
- The old AP/cozy activity system has been removed; Opportunities + mini-games are the active daily loop.
- Mobile uses a minimal sound + wordmark header and a functional bottom navigation bar.
