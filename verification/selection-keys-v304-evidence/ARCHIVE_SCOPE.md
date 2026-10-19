# v304 acceptance evidence

The full gate ran exactly once in an isolated package copied from the 2708 inputs in full-gate-inputs.json. It succeeded with empty stderr and verified unchanged original and isolated inputs. game-aggregate.json is extracted from that run, not rerun or synthesized. The separately archived baseline repeat report deliberately has 12 expected failures; it demonstrates the original problem. The final candidate and five source mutants are separate evidence. Independent review files retain their original provenance.

After the full gate, only current QA/entry completion wording and this evidence directory are added before refreshing the root checksum. No tested source, runner, test assertions or player inputs change. Final check-only output is retained outside the sealed package to avoid self-referential checksums. VM checks do not establish native-browser behavior, persistence lifecycle or FPS.

Independent review scripts retain their original workspace-relative assumptions and are archival evidence; current portable entry is verify-development.cjs. Its nonblocking runner-prose observation was corrected before the full gate and manifest hash freeze.
