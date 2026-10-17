# v0.280 natural terminal and Again evidence

Run separately: `node verification/terminal-restart.cjs`. The default regression and existing four-case long-game runner remain unchanged; this longer continuation is opt-in via its own command.

The product is byte-identical to v0.280, SHA256 `9f4dae093065bcee4f64385bfac49c359e26d70e664bc3e048baae2ac70b21c5`. This script uses normal menu, map and control events, with explicit normal `updateUI()` projection after simulated steps. Other model queries are read-only. No resources, HP, position, result or entities are injected.

Classic/easy/stronghold/standard seed 255 naturally wins at 225.55 game seconds. After the existing 30-second terminal freeze, the normal Again button starts a new battle. Its entire initial state equals a separate fresh-start game with the same seed/settings. Cash, statistics, queues, groups, selection, coordinates and time reset. HQ ID 1 is reused by a distinct object. A fresh power building costs 300 and completes; a fresh tank costs 350 and is produced. Fresh singleton selection and coordinate attack-move work. Another 20 seconds preserve the old ended world unchanged and maintain the new cash ledger (final cash 1590).

The report passes 1112 assertions and 276 checkpoints, including the repeated victory/freeze portion. These counts overlap the earlier victory witness and must not be added as independent four-case coverage. The outer stats/actions describe the ended battle; restartEvidence.newStats describes the new battle. newActions is a partial purchase log, not an exhaustive UI action log.

Input lifecycle evidence is separately modeled: before the natural terminal, seven sequential real pointerdown/pointercancel pairs create canceled control tokens. After Again, only their stale pointerup/onclick handlers are replayed, never a new pointerdown. All seven are inert, retired references are null, and fresh explicit gestures work. These are synthetic delayed-event models, not a native-browser delayed-input reproduction. The post button also has no eligible new-game troops in its circle, so that replay demonstrates combined lifecycle/eligibility rejection, not an isolated proof of its identity guard. No browser or save/load/import/export actions were performed.

Independent review reran 1112 assertions/276 checkpoints successfully and inspected the final report-only split between old/new statistics. No product defect was found. The prior four-case long-game package remains an independent frozen delivery.
