# 双闸突进: pre-implementation feasibility

## Result
The exact proposed configuration is feasible under a reproducible legal UI route. All three predeclared seeds (29301, 29302, 29303) win at 102.4667 game seconds, capturing the target at 12.4833 seconds and accumulating 90 effective seconds. Outcomes are identical across these seeds; this is a deterministic route demonstration, not a population win-rate or universal balance claim.

The win is narrow: one friendly combat tank remains inside the objective circle, about 31 HP, and enemy artillery is still active. Player losses total 12. Do not advertise this as easy, safe, or guaranteed.

## Exact configuration and rules
- scenario=switchback (双闸回廊)
- objective=stronghold (要点驻守)
- difficulty=hard (老兵)
- challenge=mobile (机动作战; no new player turrets)
- gameSpeed=1
- Target (600,500), the nearest post to map center; other posts are (600,180) and (600,660).
- Capture requires 8 seconds with combat vehicles exclusively present within radius <65. Then ownership plus friendly combat presence accumulates 90 effective seconds. Both sides inside pauses accumulation; loss of ownership or no friendly combat presence resets it.
- Player starts1700; hard enemy2200,1.5-second decision interval,40-second wave,4 defenders,24 army cap.

## Declared route, actual UI execution
1. At start, individually select the initial scout and send ordinary coordinate move to (550,510), then enable arrival hold. Send initial tanks similarly to (565,470) and (590,535).
2. Select initial factory, set rally to (580,500), enable new combat vehicles' arrival hold.
3. Pay for artillery, repair, artillery in that order:550+500+550=1600, leaving100. Initial harvester continues its natural mining behavior; no resource changes.
4. At the first one-second observation after an artillery spawns, individually select it and send ordinary move plus arrival hold: first (600,440), second (575,560). Actual issue times10 and29 seconds.
5. At19 seconds select the spawned repair and issue ordinary coordinate command(545,510). This hits the scout and the UI correctly reports repair FOLLOW/ESCORT, rather than a ground parking command. Preserve this detail when describing the demonstrated route.
6. Every game second, when cash>=450 and queue length<3, click the normal tank purchase control. Each accepted order costs350, retaining a small repair allowance. No free production, altered cooldowns, or hidden state writes.
7. Let ordinary simulation proceed to its terminal result. Rally spreading and pathfinding are unmodified; some reinforcement positions are outside the capture circle, and replacement tank coverage is essential.

## Success evidence (all three seeds)
- First capture12.4833s; final102.4667s; hold90/90; enemy hold0.
- Real harvested4140; total income4380; net spend5906; final cash174.
-14 completed paid vehicles,10 enemy targets killed,12 player targets lost.
- First actual delivery180 at5.85s; first paid artillery completes10s, repair19s, second artillery29s.
- Winning route has zero contested-circle seconds and zero simulation pause actions. Its hold progress is continuous. It does NOT establish a winning recovery after a contest/reset.
- Both HQs remain intact; actual terminal narrative explicitly reports stronghold victory.

## Retained failures, no cherry-picking
- preliminary-stale-ui/: all three seeds lost153.8667s. This preliminary harness drove advanceSimulation without normal frame UI refresh, leaving later production buttons stale-disabled. Only4 paid reinforcements completed. These are invalid as faithful continued-production evidence, retained transparently.
- strategy1-center/: corrected real-frame harness, original center-hold plan, all three seeds lost228.7667s despite23 completed paid vehicles and6300 harvest. First capture12.5333s,6.9667 contested-circle seconds, eventual enemy90-second victory. These are genuine strategy failures; not excluded from the findings.
- Main directory: revised west-edge/artillery strategy declared to parent BEFORE running all three seeds, all successful. Difficulty stayedhard throughout.

## Method and boundaries
Whole-source index.html loaded through the package's existing verification/vm-environment.cjs. Configuration changes dispatched through actual select controls and change events, then actual Start button. Unit selection uses canvas pointerdown/up/click events with assertions that exactly the intended entity is selected. Commands use actual coordinate text inputs/input events/buttons, hold controls, rally controls, and paid production controls.

Simulation uses queued requestAnimationFrame callbacks at fixed1/60-second elapsed increments, executing the product's normal frame/update/render/UI path. Read-only snapshots observe state, positions, HP, enemy population, harvest, spending, capture, contest and terminal outcome. No game-function shortcuts perform commands. No state/position/HP/resources/capture/timer injection. No saves, loads, imports, exports, browser actions, or explicit storage operations. The unchanged product's ordinary startup may inspect empty harness localStorage.

This is VM simulation/UI-handler evidence, not browser rendering/accessibility evidence. There was no product edit. Source SHA256 verified unchanged; see summary.json.

## Reproduce
From workspace root: node red-development/v293-mission-playability/verify.cjs

Main run writes all3 seed traces and stdout summaries. Archived copies retain prior script text and results for audit; archived script relative paths refer to their original main-directory execution location.
