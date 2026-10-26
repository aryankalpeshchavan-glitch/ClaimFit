# Manual QA (Ananya): tick each after trying it in the browser
1. Example "Critical example": verdict Not supported; value, population, strength contradicted; time window and conditions unknown.
2. Click a finding: matching highlights get an outline in both text boxes.
3. "Suggest narrower wording": result says Supported by the supplied evidence, labelled as a suggestion and re-verified.
4. Edit the wording to "Setup time fell by 35% for all businesses." and re-verify: must NOT be supported.
5. "Faithful wording": supported, no rewrite needed.
6. "Missing condition", "Mean vs median", "Percent vs percentage points", "At least vs exact", "Causal wording", "Unsupported superlative": each must stop at Needs human review or Not supported.
7. "Instruction-like text in evidence": Needs human review; warning shown.
7b. Edit the wording after a re-verify: the earlier result disappears until you re-verify; copy label says "not verified".
8. Click Check with empty fields: friendly error, no crash. Paste 25,000 characters of evidence: friendly "too long" error.
9. Copy result, then paste into a note: readable, includes disclaimer. Reset clears everything.
10. Phone width (about 390px): no sideways scrolling, buttons reachable, panes stacked.
11. Keyboard only: Tab to a finding, Enter expands it and focuses its words, Escape clears. Ctrl/Cmd+Enter submits.
12. Turn on reduced motion in the OS: no sliding or drawing animation.
Log bugs with: steps, expected, actual, screenshot.
