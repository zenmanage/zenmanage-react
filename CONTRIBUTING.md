# Contributing

Thanks for your interest in contributing to the Zenmanage React SDK.

## Development Setup

```bash
npm install
npm run validate
```

## Branching

- Create feature branches from `main`
- Keep pull requests focused and small
- Include tests for behavior changes

## Quality Requirements

Before opening a pull request:

```bash
npm run format
npm run lint
npm run type-check
npm run test:coverage
npm run build
npm run test:smoke
```

## Testing Guidelines

- Add tests for all public API changes
- Add regression tests for bug fixes
- Keep coverage above configured thresholds

## Pull Request Checklist

- [ ] Code is formatted and lint-clean
- [ ] Type-check passes
- [ ] Tests pass with coverage
- [ ] README/docs are updated
- [ ] Changelog updated (if needed)

## Release Notes with Changesets

When your PR changes package behavior, add a changeset:

```bash
npm run changeset
```

This creates a file under `.changeset/` used by the automated release workflow.

If you write a `CHANGELOG.md` entry by hand instead, title the heading exactly `## X.Y.Z`: no brackets and no date. The release workflow copies the section with that heading into the GitHub Release, and falls back to the whole file when none matches.
