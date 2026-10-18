# Independent v298 hold guidance review

Candidate SHA-256: d03faa6beca0518edea4d5b07fbf8f6940ae2faba257af9b65d81690be998107.

Approved for the parent release gate; no blocking wording or behavior issue found.

- 108 independent checks pass (results.json), including exact executable-script identity, 84 paired control-state cases across active/pause/restart/terminal phases, firing and pursuit behavior, artillery minimum range, moving/final-leg arrival reservation, cancellation, mixed H selection, S, successful replacement orders, rejected append orders, paused progression, and all five future vehicle types.
- 20 additional adapter boundary assertions pass: unexpected attribute values remain visible and input objects remain unchanged. Read reviewed exact per-ID attribute-value reversals and exact two added paragraph subtree exclusions; existing controls and adjacent controls remain compared.
- Source builder --check produces the candidate hash. Only authoritative template differs from the base source tree. All 1477 original files remain present; changes are limited to index/template/receipt and four current documentation files. Historical verification files are unchanged (preservation.json).

Behavior qualifications: mixed H first enables all eligible units; all-held selection toggles off. S preserves hold while clearing arrival reservation. Accepted replacement movement/attack clears both; append commands reject held units. Ordinary travel continues until arrival, then held combat units can fire within actual range but do not pursue beyond it. Separation may still displace them. Factory setting applies only on future spawn to tank/scout/artillery, not existing units or repair/harvester. Canceling arrival reservation preserves the route. Current wording accurately qualifies these points without promising arrival or invulnerability.

Testing uses the existing no-persistence VM recorder plus independent synthetic fixtures, not native browser usability or a natural victory claim. The initial scratch run had five incorrect strict `hold === false` assertions for newly created units whose unset hold is undefined; corrected to boolean semantics before the final 108/0 run. No product issue was inferred from those fixture failures. No product files were edited and no full aggregate was duplicated.
