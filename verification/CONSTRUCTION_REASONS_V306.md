# v306 construction-card feedback

Seven exact source substitutions: display version; four plain-text reason spans; one pure reason helper; one guarded textContent update. Original disabled predicate, card price/time text, title and click handling are unchanged.

The standard-battle scenario buys three tanks through existing cards, leaving 650 funds. The factory card now explains its 200-fund shortfall inline. Reason precedence: not started, terminal result, restart confirmation, mobile-challenge turret restriction, then ceil funding shortfall; available clears it. Pause alone does not block construction. No live announcements.

Focused current-source test: `node verification/construction-reasons-v306.cjs` (47/47). Frozen v305 lacks the new feedback and fails46 cases, with one read-only control passing. Negative test: `node verification/construction-reasons-negative-v306.cjs` (four exact mutations). Strict inverse12 checks and exact DOM projection134 checks pass. Independent review247 cases and all2,202 old verification files pass. Full developer gate is tracked by QA_STATUS.md.

DOM comparison excludes only four named SPAN nodes directly under the corresponding data-build cards and their child-list references. Unexpected descendants, wrong tag/parent, detached, renamed or similar siblings remain visible. Frozen prior comparators and identity gates are unchanged. Historical results retain their original version scope.

Evidence is isolated VM/mock-DOM registered callbacks, static source, and explicit cash/lifecycle fixtures. Native browser rendering, default keyboard activation, live-region behavior and assistive technology are not validated.
