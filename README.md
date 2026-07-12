# Release Please Template

A minimal Node.js repository template with GitHub governance, Conventional
Commit validation, and automated releases through release-please.

## Tooling

- Node.js 24 LTS with ESM
- pnpm
- Lefthook and commitlint
- GitHub Actions
- release-please
- GitHub Models release summaries

## Setup

```sh
pnpm install
pnpm exec lefthook install
```

Use Conventional Commits for local commit messages and pull request titles. The
repository assumes squash merging, so the pull request title becomes the commit
message on `main`.

## Documentation

- [GitHub Actions](docs/workflows.md)
- [Local commit workflow](docs/local-commit-workflow.md)
- [Release automation](docs/releases.md)
- [Rulesets and branch protection](docs/rulesets.md)
- [Coding agent instructions](AGENTS.md)

Release automation works without repository secrets. See the
[release automation guide](docs/releases.md) for GitHub Models usage and the
manual approval required for checks on automated release pull requests.
