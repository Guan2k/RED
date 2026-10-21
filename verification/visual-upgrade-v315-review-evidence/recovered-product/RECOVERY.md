# Recovered visual source candidate, fresh validation

Baseline: official v314 commit add24f6949c58980f5944f9faf6782b1851aea16 in ../../v314-recovery/repo. Baseline index d0fa1baa9faed8be2a05f050b2289ea5a419654b4d95f48cef0ff2742e52091d. Copied to ../RED; baseline untouched.

The renderer was reconstructed from the original visible tool-call replacement text, including final terrain sampling 80 and eight-rectangle single-fill selection corners. Sidebar CSS was reconstructed by its original author from its visible tool-call context, preserving the final blur(4px) budget. No prohibited session files were used. Restoration scripts/fragments are preserved one directory above.

New build/check actually reports index dfc6a5f2aebdc57aa370df3c64b47be16fb99e6757277723db3475fcafac03ef, matching the recorded earlier final development candidate. This is NOT a claim to have recovered the sealed v315 release package. Product still displays v314 pending integration. Only CSS, renderer, generated index and receipt differ from baseline.

Fresh results: 16/16 map/art semantic configurations (15 seconds each, exact operational world/track and RNG parity), 93/93 selection-key-repeat, 51/51 command-enter-repeat, 100/100 non-release-identity source builder tests, generated-source check pass. Release-identity builder case was explicitly excluded because manifest remains frozen v314, not silently repinned. First regression attempt hit existing 10s per-call VM timeout; same trajectory rerun at single-tick VM boundaries passes. Details preserved separately.

Fresh full-field-comparison.png and candidate-detail.png were generated from actual product Canvas paint recordings, replayed through SVG/Inkscape and visually inspected. Chinese labels explicitly say offline render, not browser acceptance. Synthetic scene only; no native browser, CSS layout or FPS claims.

Fresh total Canvas calls: rich baseline1036/candidate1154, paints373/437; 120-selected synthetic baseline3708/candidate5614, paints2271/2755. This is a remaining 11.4%/51.4% call overhead, not FPS. No extra caches, gradients or Canvas filters. Source recovery changes no gameplay/economy/shortcut handlers.

Products frozen; integration owns release identity, references, sealing and full gate. No remote changes made.
