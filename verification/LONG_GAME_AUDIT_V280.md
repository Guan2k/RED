# v0.280 natural long-game audit

Product source is unchanged from commit `573f5b0f6198fca9543841618e44f0abe813f584`; SHA256 `9f4dae093065bcee4f64385bfac49c359e26d70e664bc3e048baae2ac70b21c5`.

Run only these witnesses: `node verification/run-long-games-v280.cjs`.
Run current regression plus witnesses: `node verification/run-tests-v280.cjs --long`.
Default current runner remains unchanged in scope; historical `--legacy` is separate.

## Observed outcomes

- classic / stronghold / normal / seed12801: natural loss at164.900s, enemy completed stronghold.195 checkpoints, including30 frozen seconds;14 paid orders and4 constructions completed.
- frontier / harvest / normal / mobile / seed12802: natural HQ-loss at166.217s, not a mining victory.197 checkpoints;12 paid orders and2 constructions completed.
- ring / survival / normal / seed12803: natural HQ-loss at175.800s, not six-minute survival.206 checkpoints;11 paid orders and5 constructions completed.
- classic / stronghold / easy / seed255: natural victory at225.550s, progress90.256 checkpoints;13 paid orders,8 constructions and7 paid repairs.53 explicit terminal input/time freeze checks.

Main three cases:8012 assertions. Victory case:996. Total:9008 assertions /854 checkpoints. Independent review additionally reran ring seed13803 and the victory, separately counted, with no product issue found.

## Scope and accounting

Menu values, native button press/release/click, map selection, dropdown selection and coordinate entry perform gameplay actions. Read-only queries choose legal build positions and inspect state. The sole non-read-only `run` call is normal `updateUI()` projection refresh after simulation; `step` advances the game but does not invoke its RAF UI cadence. This is not a native browser acceptance test.

Cash is checked against each team's recorded initial cash + income - net spending, with1e-5 tolerance for fractional repair arithmetic. Mining and posts enter income; source review confirms salvage also enters income, while production/construction cancellations reduce net spent. These witnesses do not execute salvage or refunds, so refund semantics are reviewed, not claimed as exercised. Actual card purchases check exact cost and one new order. In the three manual-production cases, both teams' disappearing queue objects are matched to actual produced-counter increments; the victory case also checks completed friendly orders under normal automatic repeat production.

The three-case windows are bounded at240/360/420 seconds; the victory witness at600. An unobserved terminal or victory is reported honestly and is not itself proof of a product defect. The combined runner requires the fixed published witnesses to obtain their claimed coverage and raises a coverage failure if they do not.

Snapshots are taken after a full simulation step and normal UI refresh. Core state/uid/groups/selection must remain unchanged after natural ending, ordinary disabled command/payment attempts, map/keys and30 further seconds. The legitimate Again/Start action is intentionally excluded; restart continuity is a separate audit.

Initial cross-VM array identity and missing UI-refresh observation errors were retained outside this delivery. Neither was a game defect. No resource, HP, entity position or terminal-result injection; no instrumentation wrapper; no save/load/import/export, browser actions, or product version bump.
