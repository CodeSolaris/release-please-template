# Repository instructions

## Purpose

This repository is a minimal template for GitHub governance, CI and automated
releases. It uses Node.js 24 LTS, ESM, pnpm and release-please. Keep the template
small: do not add application-specific tooling until the generated project
actually needs it.

## Package management

- Use pnpm only. Do not create `package-lock.json` or `yarn.lock`.
- Keep the pnpm version in `package.json#packageManager` authoritative.
- After dependency changes, run `pnpm install` and commit `pnpm-lock.yaml`.
- CI must install dependencies with `pnpm install --frozen-lockfile`.

## Changes and validation

- Keep GitHub workflows independent and grant the least required permissions.
- Reuse repeated steps through `.github/actions/setup-project`.
- Add a reusable workflow only after multiple callers need the same jobs.
- Do not add placeholder lint, test or build commands. When source code is
  introduced, add the required tools and real scripts together.
- Validate JSON and YAML files changed by the task and run the closest available
  checks. For commit rules, use `pnpm exec commitlint`.

## Commits, pull requests and releases

- Use Conventional Commits for commit messages and pull request titles.
- Assume squash merge: the pull request title becomes the release commit.
- Use release-please as the only release mechanism.
- Use GitHub Models through `actions/ai-inference`; do not add external AI keys
  unless the repository intentionally changes providers.
- Preserve release-please technical notes when changing AI-generated summaries.
- Keep release PRs limited to generated version and changelog changes.
- Do not bypass required checks, CODEOWNERS reviews or repository rulesets.

## Documentation

- Update documentation in the same change when behavior or commands change.
- Prefer short, factual instructions that match the current repository.
- Do not document planned checks or files as if they already exist.
