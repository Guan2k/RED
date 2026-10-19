# Current v309 evidence

Current full isolated developer gate, exact SVG replay, read-only state/toggle tests, six mutations, strict source inverse, exact DOM-subtree projection boundaries and independent review. Historical archives retain their original scope. The design board is replayed Canvas-command artwork, not a browser screenshot; 7719 independent assertions include repeated SVG structure checks, not gameplay scenarios. Native narrow-screen layout, physical keyboard, screen readers and Path2D pixel rendering remain unverified.

The early beginner-guide-v309-dom-check.json records one obsolete version-mutation anchor failure. It was corrected before gate; beginner-guide.json and the complete gate contain the passing current result. New test probes also exposed an empty-string boolean attribute check and an overly broad CSS substring assertion; both were tightened before the six mutation controls passed. Product source did not change during these test corrections.
