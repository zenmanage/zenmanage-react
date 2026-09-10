# Publishing Next Steps

This guide covers publishing `@zenmanage/react` to public package registries.

## 1. Pre-Release Checklist

Run this from the package directory:

```bash
npm install
npm run validate
```

Ensure all items are true:

- `README.md` reflects the current API
- `CHANGELOG.md` includes release notes
- version in `package.json` is correct
- CI passes on PR and main

## 2. Publish to npm (Primary)

Authenticate:

```bash
npm whoami || npm login
```

Optional dry-run:

```bash
npm pack --dry-run
```

Publish:

```bash
npm publish --access public
```

Verify:

- Package appears at `https://www.npmjs.com/package/@zenmanage/react`
- install smoke test works in a clean project

## 3. Publish to GitHub Packages (Optional Secondary Registry)

Add scoped registry auth in your CI or local `.npmrc`:

```ini
@zenmanage:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Publish:

```bash
npm publish --registry https://npm.pkg.github.com
```

Notes:

- keep npm as canonical public source for broad compatibility
- GitHub Packages is useful for internal mirroring and enterprise workflows

## 4. Add Automated Release Workflow (Recommended)

Use Changesets or semantic-release to:

- version and tag automatically
- publish only after CI passes on main
- generate changelog entries from PR metadata

This package is already configured with Changesets:

- Create a release note entry: `npm run changeset`
- Version packages from entries: `npm run version-packages`
- Publish using configured workflow: push to `main` with `NPM_TOKEN` set in GitHub secrets

Workflow file: `.github/workflows/release.yml`

## 5. Post-Release Validation

- install in a sample React app
- verify ESM + CJS imports
- verify TypeScript declaration quality
- run a quick smoke test for `FlagsProvider`, `useFlag`, and `useVariant`

## 6. Suggested Registry Strategy

- Primary: npm (`@zenmanage/react`)
- Secondary: GitHub Packages mirror (same version)
- Keep release artifacts and tags aligned across registries

## 7. Security and Supply Chain

- enable npm provenance when possible
- protect release branches/tags
- require 2FA on publisher accounts
- use least-privilege automation tokens
