# v299 global repeat-mode scope evidence

Run from any working directory:

```sh
node verification/global-repeat-mode-scope-v299.cjs
```

The optional first argument is the candidate HTML path. It must match the pinned
v299 source SHA-256 `0113fe16d55a5eebdb68ccc8615d1dd4c935bd0dd32068b02db8bb081d82c071`.
This new mode-selector suite is separate from the inherited
`global-repeat-scope-v299.cjs` vehicle-type selector coverage.

## Result

`results.json` records **31 passing cases, zero failures, 979 assertions and 690
complete state comparisons**. The 690 comprise four setup/transition comparisons
plus 200 steps in the completed-production scenario, and 81 comparisons in each
of six independent scenario pairs. Twenty-three negative controls require their
specific expected diagnostics; an unrelated exception cannot count as a pass.

The full world state, every log entry in order, selection, groups, pending input
modes, drag/restart state, simulation remainder and durable state are retained.
Only a log entry exactly equal to either approved new receipt is replaced by its
exact previous string for comparison. Prefixes, suffixes, other messages, missing
messages, extra messages and changed message order remain observable. Separate
offline snapshot controls prove those boundaries; these controls do not mutate a
game world. RNG state is also compared after each paired run.

## Natural behavior proof

All scenarios use Start, the actual factory/power build cards, mouse pointer
placement and Select All Factories. They verify normal construction payment,
completion, sufficient power and exactly two selected completed factories. No
world, cash or order injection is used.

- The 200-step run selects independent scout production, switches global mode
  parallel → single → parallel, compares complete state after each transition and
  every 0.05-second step, and observes four completed scouts.
- Six fresh pairs cross off, independent-factory and global production with
  single and parallel global modes. Each compares complete state initially and
  after 80 steps. Independent production retains two paid orders and identical
  cash across both global mode choices. These shorter scenarios establish order
  behavior, not completed vehicle production.
- Global-off mode presets buy no orders. After enabling global scout production,
  actual single mode yields one paid order and parallel mode yields two. Each
  order pays the normal scout price and has the scheduler's actual order markers.

## Source and wording boundaries

The strict packaged `restore-v298.cjs` derives the exact v298 baseline from the
current HTML. That baseline is written only into a disposable temporary host.
Reversing only the two approved receipt literals separately restores the entire
inline executable byte-for-byte. A forced-parallel scheduler mutation and an
unrelated executable-byte change both fail this specific restoration gate.

Accessible name/description, full title, both option labels, visible hint and both
receipt branches are checked. Negative controls target each, including a hidden
or accessibility-hidden hint and a duplicate hint. Reserve, global type/target,
and independent-factory type/target selectors remain byte-identical to v298.

`provenance.json` maps the original prototype and independent review coverage to
this suite and records their source hashes. Every original prototype scenario
and all six independent-review scenario pairs are retained; the prototype's
previously omitted logs are now included. Existing verification files were not
edited by this task.

## Portability and limits

`portable-check.json` records a second successful run from a fresh minimal host
containing only the HTML, suite, contract helper, packaged no-persistence VM,
strict restoration module and its change list. Its full JSON report exactly
matches `results.json`. There is no sibling baseline/prototype/review dependency.

This is a focused seeded synthetic DOM/VM proof using simulation-step progression.
The no-persistence VM disables bootstrap persistence hooks and throws if storage
is otherwise used. No save, load, import or export action is exercised. Native
browser layout and assistive-technology behavior are not measured. No full
aggregate or publication was performed by this focused task.
