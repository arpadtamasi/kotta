# TODOS

## Infrastructure

### Run the test suite in CI on every pull request

**What:** A GitHub Actions workflow that runs `npm test` on push and pull request and writes a JUnit report.

**Why:** Today nothing runs the tests before a merge: `.github/workflows/` holds only `npm-release.yml` and `pages.yml`, while the repository took 1246 commits in the 60 days before 2026-09-20.

**Context:** Found by the 2026-09-20 CEO review of the "proof first" plan. Any later evidence work that reads test results (see the gap item below) would take its JUnit report from this workflow, in a defined environment, instead of from a runner Kotta builds itself. Start from `npm-release.yml` for the Node setup; vitest writes JUnit with `--reporter=junit`.

**Effort:** S
**Priority:** P2
**Depends on:** None

## Gap

### Bind evidence to assertions, not to a substring anywhere in a file

**What:** Make `kotta gap` distinguish a node that a test actually exercises from a node whose id merely appears in a file.

**Why:** `src/commands/gap.ts:326` counts a node as evidenced when `file.text.includes(node.id)`: a comment, a test name and a stray string weigh the same. Putting the id in a test name therefore adds almost nothing, which is why test binding was deferred (decision D17 of the 2026-09-20 review).

**Context:** The review's outside voice showed that "cited" and "bound" coincide for nearly every node under substring matching. Known hard limit even after this work: a test whose name carries an id but whose body asserts nothing passes every machine check. Decisions D3, D4, D9 and D11 of that review (full id via a helper, JUnit only, skipped is never green, all bound cases must pass) remain the starting design; D10 (XML hardening) and D15 (schema ceremony) were judged unnecessary for a local, unpublished report.

**Effort:** M
**Priority:** P3
**Depends on:** Run the test suite in CI on every pull request

## Completed
