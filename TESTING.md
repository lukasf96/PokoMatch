# Testing strategy and backlog

## Test stack

The project uses **Vitest** for unit and integration tests. It is the closest fit for
the existing Vite + TypeScript setup, runs source modules without a separate
transpilation configuration, and leaves room to add React Testing Library and a DOM
environment when component tests are introduced.

Run the suite once with `pnpm test`, use `pnpm test:watch` while developing, or
generate an HTML coverage report with `pnpm test:coverage`.

Tests live beside the source they protect and use the `.test.ts` / `.test.tsx`
suffix. Prefer observable behavior and invariants over implementation details.

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
- [ ] Auto matching: regression fixtures based on representative full-dex subsets;
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

- [ ] Add `@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom`, and a DOM environment (`jsdom` or `happy-dom`).
- [ ] Pokédex: search/filter and lock controls update visible results and store state.
- [ ] Match Maker: selected roster produces auto groups; loading/worker errors and
  empty states render correctly.
- [ ] Custom groups: create, add/remove Pokémon, reject duplicate/full-group adds,
  reorder, location selection, and suggested-group import.
- [ ] Data transfer dialog: export, copy feedback, valid import confirmation, invalid
  import errors, and sanitization summary.
- [ ] Settings: theme, language, evolution preference, and persistence across render.
- [ ] Routing: navigation, lazy-page fallback, document titles, hash scrolling, and
  error-boundary fallback/recovery.
- [ ] Accessibility: keyboard operation, focus management for dialogs/menus, labels,
  headings, and automated axe checks on each page.

### P3 — browser and operational confidence

- [ ] Add Playwright smoke tests for home → Pokédex → Match Maker, including a
  reload that verifies browser persistence.
- [ ] Test import/export between two clean browser contexts.
- [ ] Test mobile and desktop breakpoints plus drag-and-drop keyboard interaction.
- [ ] Verify the web worker in a production build and its fallback/error path.
- [ ] Add CI gates for `pnpm lint`, `pnpm test`, and `pnpm build`; publish test and
  coverage results on pull requests.
- [ ] Add Vitest coverage with initial thresholds focused on domain services, then
  raise thresholds as P0/P1 work lands.
- [ ] Add performance regression checks for representative and full-roster matching
  against the existing benchmark script.

## Test design notes

- Matching is heuristic and time-budgeted. Tests should assert hard constraints,
  determinism, ordering, and score floors rather than require one exact grouping.
- Use small, explicit Pokémon fixtures in unit tests. Keep full catalog fixtures for
  a limited number of regression/performance tests so failures remain easy to read.
- Reset Zustand state, timers, storage, workers, and mocks after each future test to
  avoid order-dependent failures.
