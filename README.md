# Forge a Nation V2.13.4
- BGM playback is capped to exactly 60 seconds per track.
- At 60 seconds the current track stops and the next track is randomly selected.
- Immediate track repetition is avoided when multiple tracks are available.
- Natural `ended` events also advance to the next track if a track is shorter than 60 seconds.
- Mute/stop clears the 60-second timer.
