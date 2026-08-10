# Testing strategy and backlog

## Test stack

The project uses **Vitest** and React Testing Library for unit and integration tests,
plus **Playwright** for critical behavior in a production build.

Run the suite once with `pnpm test`, use `pnpm test:watch` while developing, or
generate an HTML coverage report with `pnpm test:coverage`. Run
`pnpm test:coverage:core` for the stricter per-file business-logic gate and
`pnpm test:e2e` for the production-build browser suite.

Tests live beside the source they protect and use the `.test.ts` / `.test.tsx`
suffix. Prefer observable behavior and invariants over implementation details.

## Coverage policy

Application-wide coverage includes every runtime `.ts` and `.tsx` module
automatically. Its baseline catches broad regressions across pages and presentation
code without requiring a filename allowlist.

A second gate automatically includes services, state management, hooks, and
TypeScript utilities. Every file in those architectural directories must maintain
at least 65% statements, branches, functions, and lines, so a new untested core
module cannot hide behind aggregate coverage from older files.

The per-file core gate intentionally excludes code where line coverage is a poor
proxy for confidence:

- Application entry/composition files and route lazy-import declarations.
- Static MUI theme declarations, icon/color maps, and type-only modules.
- Presentation-only cards, chips, skeletons, avatars, and page layout markup.
- Large page compositions exercised through browser smoke tests rather than
  branch-by-branch jsdom assertions.

Exemption from the strict per-file gate does not mean "never test." A presentational
component still warrants a focused test when it owns meaningful interaction,
accessibility, fallback, or state behavior. Browser coverage remains tracked
separately in the P3 backlog.

### Test audit decisions

- Removed theme tests that primarily re-tested MUI's `createTheme` and static maps.
- Removed the `MatchHighlight` render test because search segmentation already
  verifies the application logic; rendering a MUI `Box` as `<mark>` added little.
- Removed the error boundary's healthy-child test because React child rendering is
  framework behavior; the application fallback and logging test remains.
- Retained router tests because they verify PokoMatch's path-to-page wiring,
  fallback, and unknown-path policy—not React Router's internal matching.
- Retained dialog and settings tests because they verify validation gates and
  Zustand mutations across real user interactions.

## Current critical coverage

- [x] Auto matching preserves every input exactly once, enforces the four-member
  limit and habitat conflicts, and returns stable presentation ordering.
- [x] Collection transfer strings round-trip unlocked Pokémon, group order,
  locations, and IDs, and reject corrupted input.

## Prioritized backlog

### P0 — core data correctness

- [x] Auto matching: empty, singleton, fewer-than-four, and all-mutually-conflicting
  inputs.
- [x] Auto matching: output remains deterministic for the same input and options.
- [x] Auto matching: evolution-line preference improves the intended secondary
  objective without violating compatibility or lowering raw-affinity tie breaks.
- [x] Auto matching: regression fixtures based on representative full-dex subsets;
  assert invariant validity and a minimum score, not one exact heuristic partition.
- [x] Suggestions: incompatible habitats are excluded and compatible candidates
  are ranked by total shared favorites across all current members.
- [x] Suggestions: deterministic dex/name tie-breaking, limit handling, empty group,
  and zero-affinity candidates.
- [ ] Suggestions: group-at-capacity behavior at the caller boundary.
- [x] Group scoring: unordered pair sum, no double counting, empty/singleton groups,
  duplicate favorite tags, and favorites spanning both 32-bit masks (>32 tags).
- [x] Transfer decoding: empty input, unknown/missing prefix, unsupported version,
  invalid base64/JSON, invalid payload shape, and missing checksum.
- [x] Transfer sanitizing: remove unknown and duplicate Pokémon IDs, cap groups at
  four, remove empty groups, preserve ordering, drop invalid locations, and replace
  missing/duplicate group IDs.
- [x] Persisted-store migration: legacy `string[][]`, absent settings, stable
  migrated IDs, and `Set` hydration.
- [ ] Persisted-store migration: malformed persisted JSON and malformed groups.

### P1 — state and domain services

- [x] Store collection actions: lock/unlock/toggle, bulk operations, and replace
  imported data without retaining mutable caller references.
- [x] Custom groups: add/delete/reorder, prevent cross-group duplicates, enforce
  capacity, remove members, and assign/clear locations.
- [x] Custom-group normalization: current and legacy shapes, invalid members and
  locations, missing IDs, and order preservation.
- [x] Item suggestions: score, Pokémon coverage, exclusions, and stable ordering.
- [x] Habitat conflict helpers: all three opposite pairs, symmetry, unique group
  conflicts, and empty/same-habitat groups.
- [x] Pokémon catalog helpers: standard/event/Basin classification, habitable
  filtering, and dex ordering for numeric and special dex values.
- [x] Localization: English fallback and German/French localized names.
- [x] Search/highlighting: accents, punctuation, whitespace, tokenization, matching,
  and correct highlight segment boundaries.
- [x] Sprite URL handling and group display-habitat tie-breaking.

### P2 — React integration tests

- [x] Add `@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom`, and a DOM environment (`jsdom` or `happy-dom`).
- [x] Pokédex: search and lock controls update visible results and persisted state
  (Playwright critical flow).
- [ ] Match Maker: selected roster produces auto groups; loading/worker errors and
  empty states render correctly.
- [x] Auto-group worker hook: request payloads, response mapping, stale responses,
  previous-result retention, empty pools, and worker cleanup.
- [ ] Custom groups: create, add/remove Pokémon, reject duplicate/full-group adds,
  reorder, location selection, and suggested-group import.
- [x] Data transfer dialog: export, copy feedback, valid import confirmation, invalid
  import errors, sanitization summary, and confirmed replacement.
- [ ] Settings: evolution preference and persistence across render.
- [x] Settings menu: theme and Pokémon-language selection.
- [ ] Routing: error-boundary
  reload recovery.
- [x] Lazy-page fallback and hash scrolling.
- [x] Route selection and unknown-path redirect.
- [x] Document titles and error-boundary fallback rendering.
- [x] Deferred mounting, multi-section readiness gates, and hash scrolling after
  deferred content becomes ready.
- [x] Feedback validation, configuration, API submission, errors, and rate limiting.
- [ ] Accessibility: keyboard operation, focus management for dialogs/menus, labels,
  headings, and automated axe checks on each page.

### P3 — browser and operational confidence

- [x] Add Playwright smoke tests for home → Pokédex → Match Maker, including a
  reload that verifies browser persistence.
- [ ] Test import/export between two clean browser contexts.
- [ ] Test mobile and desktop breakpoints plus drag-and-drop keyboard interaction.
- [ ] Verify the web worker fallback/error path. Its successful production-build
  path is covered by Playwright.
- [x] Add CI gates for lint, full-source coverage, per-file core coverage, build,
  and Playwright tests on pull requests and `main`.
- [x] Enforce full-source regression thresholds plus a 65% per-file gate for core
  application logic.
- [ ] Add performance regression checks for representative and full-roster matching
  against the existing benchmark script.

## Test design notes

- Matching is heuristic and time-budgeted. Tests should assert hard constraints,
  determinism, ordering, and score floors rather than require one exact grouping.
- Use small, explicit Pokémon fixtures in unit tests. Keep full catalog fixtures for
  a limited number of regression/performance tests so failures remain easy to read.
- Reset Zustand state, timers, storage, workers, and mocks after each future test to
  avoid order-dependent failures.
