# v307 precise new-order funding receipt

Exactly two source substitutions: display version and buy()'s insufficient-cash receipt. No new markup or DOM projection. All original purchase guards, queue assignment, cash mutation and success receipts remain exact.

Natural scenario: buy four tanks at start, leaving300 funds and four paid orders, then press4. The failure now names the tank/new order and50-fund shortfall, with paid-order retention. The suffix appears only for a nonempty complete production queue, including assigned and exit-waiting orders; it does not promise immediate production.

Run `node verification/purchase-funding-v307.cjs`:192/192 current; frozen v30670/192 because122 receipts lack the intended feedback. Four receipt mutations are detected by `purchase-funding-negative-v307.cjs`. Independent source review188 cases passes. Strict inverse7 cases and inherited DOM boundary134 cases pass. No historical tests are relabeled; original files remain byte-identical.

Evidence is whole-source isolated VM/mock-DOM with registered controls and explicit fractional cash/lifecycle fixtures. Native keyboard timing, rendering/accessibility and real save data are not validated. Full release status is in QA_STATUS.md.
