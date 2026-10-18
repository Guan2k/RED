# Actual-command rail comparison

Recommended review image: progress-rail-actual-replay.png. This supersedes the earlier hand-composed factory-only concept for implementation review.

Baseline is frozen v295, SHA256 6e59483fa674381da5ebf5e476cb1bd9cc6e65c20679b8803b18b5827b0ff7aa. Corrected isolated candidate is progress-rail-prototype/RED/index.html, SHA256 3841cf1a441494c4d268f187eed51332563968c1846b5f57925f3a9b72ab63b3. Product edits belong to the rail implementation actor; this directory contains visual evidence only.

The builder invokes actual render() for eleven synthetic states in both sources, with the existing combined art preview enabled in both. It records real drawing commands and nested clip state, then crops the factory/building region from each full render. SVG viewport clips explicitly prevent neighboring terrain/objects spilling outside comparison tiles. The PNG was exported with installed Inkscape and inspected after adding these viewport clips.

Cases: 0%, 50%, 100%, paused, power shortage, waiting exit, ended, factory construction, power construction, refinery construction, rotated turret construction. All are selected; power-shortage/ended/turret cases also have low HP. Paused shading, labels, health and selection come from product render(), not illustrative overlays. Each case is shown at 1x and 0.5x.

For every pair the script asserts identical serialized state, unchanged state after rendering, equal paint counts and exactly two fillRect y-coordinate changes. Production deltas are -3; construction deltas -2. Every other recorded geometry, style, transform and clip attribute is byte-equivalent after normalizing those two y positions. RNG throws if rendering calls it.

provenance.json includes source hashes, exact fixture code, complete fixture state, state hashes and paint diffs. build-proof.cjs reproduces the SVG. Existing no-persistence VM suppresses bootstrap storage access. No real storage, browser, install or network operation occurs.

Limitations: synthetic Canvas/Path2D recorder plus SVG/Inkscape conversion. This is not a native screenshot, browser font/layout test, GPU/backend test or FPS measurement. The comparison supports the geometric rail correction; it does not claim all reduced-scale text becomes readable.
