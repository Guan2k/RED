# Newly executed v315 targeted preflight

These reports were executed anew against the recovered candidate; no earlier
workspace scores are reused. This is not the full release gate. Commands and
suite hashes are recorded in each `.meta.json`; the matching `.report.json`
contains the complete unfiltered output. The 25 inherited reports include only
the exact 15 frozen historical-identity rejections. Health has a separate fresh
execution receipt. All 3,624 existing verification files remain byte-identical.

The scripts are retained as the exact recovery orchestration used. Their paths
are relative to the sibling recovery directories documented in them. To rerun,
copy them to `v315-recovery-adapter-preflight` beside the frozen baseline and
integration directories, then invoke `python run-one.py <suite-name>` and
`node preflight-inherited.cjs`. Migration is not required to execute the suites.
The two health suites run directly with Node from the package root.

All render evidence is synthetic Canvas/Node or generated markup, not native
browser raster, input latency, accessibility acceptance, or measured FPS.
