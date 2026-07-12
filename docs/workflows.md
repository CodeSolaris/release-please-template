# GitHub Actions

The repository contains three independent workflows:

- `validate.yml` verifies the lockfile by installing dependencies on pull requests and pushes to `main`.
- `pr-title.yml` validates pull request titles with commitlint.
- `release-please.yml` creates release pull requests and GitHub Releases from changes on `main`.

The release workflow normally runs after a push to `main`. It also supports a
manual run from the Actions tab for recovery and verification.

The shared Node.js, pnpm, and dependency setup steps live in
`.github/actions/setup-project/action.yml`.

## Dependency installation

CI uses the pnpm version declared by `packageManager` in `package.json` and runs:

```sh
pnpm install --frozen-lockfile
```

Dependency changes must include an updated `pnpm-lock.yaml`.

The validation workflow runs `pnpm test` for the release-summary tooling. The
repository currently has no application source, so it does not define lint or
build jobs. Add them together with the corresponding project tooling.

## Release pull requests

Release-please and GitHub Models use the temporary `GITHUB_TOKEN` supplied by
GitHub Actions. No repository secrets are required.

When a release pull request is created or updated, the workflow prepares the
technical notes as file input and calls `actions/ai-inference`. The prompt
requires structured business metadata. `scripts/release-summary.js` validates
the response and updates the pull request body while preserving the technical
notes.

Pull request workflows created through `GITHUB_TOKEN` require manual approval
before they run. See [Release automation](releases.md#authentication-behavior)
for details.
