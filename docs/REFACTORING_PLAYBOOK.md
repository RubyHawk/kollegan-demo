# Refactoring Playbook

Refactors must improve structure without hiding data risk or behavior changes.

## Standard Flow

1. Start from an up-to-date `origin/main` branch.
2. Run `git status`.
3. Identify protected flows.
4. Add or verify tests for the behavior being preserved.
5. Extract one responsibility at a time.
6. Run checks.
7. Record evidence when security-relevant.

## Split Order

1. Public offer page.
2. Offerter dashboard.
3. Document/PDF generator.
4. Product library.
5. Companies.
6. Projects.
7. Templates.
8. Settings/appearance.
9. Sidebar/dashboard shell.

## Do Not Mix

Avoid mixing these in the same PR:

- schema changes and UI restructuring,
- dead-code deletion and behavior changes,
- API shape changes and route moves,
- branding rewrite and public signing changes.

## Completion Criteria

A split is complete only when behavior is preserved, tests pass, file size drops below threshold, ownership boundaries are clearer, and no new monolith appears elsewhere.

