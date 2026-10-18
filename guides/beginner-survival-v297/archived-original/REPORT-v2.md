# Beginner survival guide assessment

## Result
Existing seven presets adequately cover the five objectives. Recommend no eighth preset. A separate short guide for existing 斜线守卫 with manually selected 休闲 has now passed a bounded normal-start simulation check. Draft: GUIDE-DRAFT-zh.md. No product or main player guide changes.

## Predeclared comparisons
POLICY-v1.md and all genuine losses remain unchanged: seeds29801/29802/29803 each lost at295.25s. Its stationary frontline failed before the objective; this is not a product bug or proof easy mode is unwinnable. Initial stale-UI harness attempts are separately retained and are not gameplay losses.

POLICY-v2.md changes only omission of the two arrival-hold clicks. All other UI actions, settings, coordinates, thresholds and seeds match v1. All three win at360s, HQ1800/1800 at every recorded checkpoint; final cash4288, harvested10440, paid vehicles18, losses20. This controlled contrast supports allowing normal autonomous combat movement for this particular route; it does not establish a universal single cause of defeat.

POLICY-v2-delayed.md was frozen before its runs. It shifts maintenance from30/60/.../330 to45/75/.../345 seconds, sampled on the first following one-second observation. All three win at360s, HQ1800/1800 at all recorded checkpoints; final cash4040, harvested10080, paid vehicles18, losses22. Opening is arranged under normal pause, so there is no precision realtime opening requirement. No further route tuning was performed.

The three seeds within each policy give identical recorded outcomes, so these should not be presented as diverse random battles or a statistical win rate. Six wins and intact HQ provide evidence of tolerance to this specific maintenance delay, not general beginner usability or guarantee. Exact coordinate placement remains a limitation for novice transfer.

## Reproduction and boundary
From workspace root:
- node red-development/beginner-survival-guide/verify-v2.cjs
- node red-development/beginner-survival-guide/verify-v2-delayed.cjs

These write their respective trace/summary files. Actual recorded outputs are run-v2.log / run-v2-delayed.log, both stderr files empty. The harness drives real requestAnimationFrame callbacks with normal fixed-step simulation, UI events, paid production and legal construction; pauses are ordinary player actions. No direct world edits, AI/RNG suppression, real storage or persistence actions. Existing no-persistence VM omits persistence bootstrap and throws on prohibited calls. No native browser or physical usability claim.

Source remains v297-health-edge/RED/index.html SHA256 ad451d7dd2b7b29e7006e7a5a9747694fb09e49455b2a76054b7dc29b91a571d. Source and package were not edited. No game aggregate rerun is needed for this read-only guide assessment. Parent decides whether/where to publish the guide.
