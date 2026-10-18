# Independent read-only document-contract review

Conclusion: useful developer-tool direction, but do not adopt the current parser unchanged. Three concrete parsing false positives should be fixed. A fourth uncovered-scope case should either be checked or explicitly excluded from claims.

Own private fixture reproduction in probe.cjs/probe-results.json:
1. README's current testing section contains no current command, only `### v0.278 历史` / `#### 示例` / an otherwise matching command. inspect reports failed:0 because any deeper ordinary heading resets historical=false. Track historical scope by heading depth; only same-or-shallower headings should exit it.
2. A real link to #valid passes although its only matching `## valid` heading is inside a fenced code block. Anchor extraction scans raw target text. Use the same visible-prose filter for target headings, preserving duplicate visible-heading numbering.
3. The current command paragraph appears only inside an HTML comment. inspect still reports failed:0. Strip comments as non-rendered content before all heading/current-paragraph/link checks, including multiline comments.
4. CURRENT_VERIFICATION_ENTRY.md heading says301 but正文 says current run-tests-v300.cjs; inspect reports failed:0. Only its heading and link readability are checked. Add a bounded explicit current-entry command contract if claiming cross-document entry consistency; otherwise clearly limit coverage to README's designated current paragraph.

Read-only design is appropriate: fs operations are reads/stat/realpath only, runner contents are hashed rather than imported or executed, no network/external-link fetches, CLI resolves an explicit package root independently of tool location. Existing authored fixtures already cover malformed JSON, missing documents/source/runner, schema/hash/version errors, unsafe paths, symlink escape, duplicate current sections, stale README commands/links, and relocated CLI. This review does not mislabel those as missing tests. Own fixture snapshots confirm target bytes unchanged; deliberately throwing runner text was not executed.

Error codes for the implemented checks are reasonably specific (manifest/individual read/current command/link/anchor), but successful false positives above have no diagnostics. Add regression fixtures requiring the exact relevant failure code, not merely any failure. Keep the tool described as a bounded Markdown contract for trusted development files, not a full Markdown parser or security boundary; lstat/realpath/read races remain possible with concurrent writers.

No candidate package or tool edits, game gate, real storage actions or publication. Only independent private fixtures and evidence were written.

## Revised prototype acceptance

Final reviewed checker SHA-256: 2cc8d16335cf702f7ca5f0e366c03242807b177c9bb388c08619b0cbd8385214. Suitable for later integration as a bounded read-only developer document contract; prior blockers are fixed.

Original four private repros now fail at their intended exact checks: historical descendant/current paragraph → current-runner-line, fenced fake heading → anchor:README.md:CURRENT_PLAYER_GUIDE.md#valid, comment-only paragraph → current-runner-line, stale entry runner → current-entry-command:0. Further probes verify inherited guide history exclusion, long fences whose shorter apparent closer must not expose headings, comment-only guide claims, accepted real fenced commands and accepted historical stale entry examples. A second-review quoted invalid option initially escaped the prefix regex; final tokenization now rejects it at current-entry-command:0. That intermediate output is retained in revised-probe-results.json.

Final independent run checks expected acceptance/rejection for 11 fixtures plus five CLI portability/usage cases, 16 cases total. Both absolute and relative target roots work from an unrelated cwd; missing/unsupported/extra CLI arguments exit2. Target bytes remain unchanged, and the deliberately throwing runner is read/hash-only. Results: final-probe-results.json; original failures remain in probe-results.json and probe-initial.cjs.

Parser remains a deliberately bounded contract for the project's explicit ATX headings/current paragraphs/simple command declarations, not a complete Markdown/CommonMark or shell implementation. It does not validate native link rendering, fetch external URLs, provide authenticity or security isolation, or replace the game/package gate. Concurrent-writer TOCTOU limitations remain. Integration must preserve this scope and add no automatic rewriting or runner execution.

Final freeze addendum: author additionally applied full token equality to README's exact underlying-runner declaration. Re-reviewed final SHA facc2f413a4c20e75c1c8eb4c79b2b3b68a661b569bfe8d161eb802cb4c2b456; all prior fixtures rerun, plus an independent README quoted extra-option rejection, now 17 total cases pass. This supersedes the checker hash above; acceptance conclusion unchanged.
