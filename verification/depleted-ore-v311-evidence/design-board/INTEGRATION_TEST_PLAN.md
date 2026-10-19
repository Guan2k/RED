# Proposed integration boundaries (not implemented)

Await parent review of the board. If accepted, add only a pure depleted-bed drawing helper and one ground-layer invocation; preserve all existing positive-ore drawings and label layout byte-for-byte. Do not modify mining, hover hit testing, pathfinding, resources, collision, schema or commands. Treat this as visual continuation, not a defect fix.

Required checks:
- Positive fractional .1 and threshold values1500/4500 retain exact current graphics/labels; zero gets only a muted empty bed, no gold pieces or quantity label.
- Natural final harvest(.05) reproduces .1→0 with correct cargo; marker appears only after depletion, disappears after fresh game/reset map creation, and follows valid loaded zero-resource state in isolated fixtures.
- All maps and preview modes; paused/result rendering is read-only. Full world, selection, mining assignments, queues and resources unchanged by repeated rendering.
- Context styles, dash, alpha and transforms balanced; draw order keeps footprint below entities and does not obscure original rock/building outlines. Shared canvas boundaries may clip edge-site decorations naturally; no claim of native raster acceptance.
- Existing live-ore density and sub1000 label suites unchanged. Any inherited rendering projection must identify exact new commands/geometry/state, not strip generic gray shapes or circles.
- Negative controls for positive-ore marking, residual gold, wrong coordinate/radius, leaked dash/alpha, or accidental world mutation.
- Preserve existing hover detail, right-click selection/commands and automatic reassignment semantics; do not infer remaining mineable ore from the marker.

Native layout/readability, real pointer behavior and browser pixels remain outside the isolated recorder evidence. The design PNG is not a browser screenshot.
