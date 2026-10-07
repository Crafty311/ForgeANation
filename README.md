# Forge a Nation 2.0

Forge a Nation is a single-player cozy 3D city-builder + nation simulator.

## 2.0 systems
- Real city-building loop: homes, apartments, shops, cafes, schools, clinics, parks, markets, workshops, warehouses, stations, museums, stadiums and universities.
- Road expansion and zoning.
- Player-built structures persist and appear in the 3D city.
- Daily opportunities replace the old 10 AP abstraction with short multi-step activities.
- Citizens, businesses, city happiness, jobs, housing, income and population react to development.
- End the day whenever you want; the day report summarizes what changed.
- Multiple cities share the national economy and national map.
- Existing 3D city progression, national map, landing globe, responsive UI and local saves are preserved.
- No multiplayer and no account required.

## Free asset sources
The city renderer uses Kenney CC0 asset families when available through the runtime catalog, including City Kit (Roads), City Kit (Suburban), City Kit (Industrial), City Kit (Commercial), and Nature Kit. The project also keeps a procedural fallback so the game remains playable if the remote asset catalog is unavailable.

Kenney: https://kenney.nl/assets
City Kit (Roads): https://kenney.nl/assets/city-kit-roads
City Kit (Suburban): https://kenney.nl/assets/city-kit-suburban
City Kit (Industrial): https://kenney.nl/assets/city-kit-industrial
Building Kit: https://kenney.nl/assets/building-kit
Nature Kit: https://kenney.nl/assets/nature-kit

The project also uses the procedural-city approach derived from the MIT-licensed THREEx.ProceduralCity project:
https://github.com/jeromeetienne/threex.proceduralcity

## Run
npm install
npm run dev

V2.1 ACTIVITY UPDATE
- Replaced three-step click-through opportunities with replayable mini-games.
- Random activity game each time: Rock Paper Scissors, Tic-Tac-Toe, Heads or Tails, Most Fingers Wins.
- Mini-games support unlimited rounds until the player chooses Finish Activity.
- Rewards scale modestly with wins/streak while losses still allow completion.
- The activity's result is recorded in city history and the daily report.


## Mini-game references
V2.3 uses original Forge a Nation implementations informed by open-source interaction patterns from MIT-licensed browser-game projects: Ajay Dhangar rock-paper-scissors, Kaustubh Deshmane tic-tac-toe, and Bektas Sari flip-coin. These projects were reviewed as references; no external runtime dependency is required.
