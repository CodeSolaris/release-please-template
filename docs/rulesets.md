# Branch Protection and Rulesets

Protect `main` with a repository ruleset or branch protection. Prefer rulesets
when an organization needs one policy model for branches and tags.

Before requiring CODEOWNERS review, verify that the owner configured in
`.github/CODEOWNERS` has access to the generated repository. Replace it when
the template is created under a different account or organization.

## Recommended rules for main

- Require pull requests before merging.
- Require at least one approval.
- Require review from CODEOWNERS.
- Require successful status checks.
- Require branches to be up to date before merging when conflicts are common.
- Require linear history.
- Block force pushes.
- Block branch deletion.
- Limit who can bypass the ruleset.

## Required checks

Start with:

- `Validate / validate`
- `PR title / title`

Confirm these names after the first Actions run because GitHub identifies
required checks by their exact names.

## Squash-only repositories

When squash merge is the only allowed merge method, the pull request title
becomes the releasable commit subject. Validate pull request titles with
Conventional Commits so release-please can parse the squash commit on `main`.

## Tag rules

For release tags:

- Protect `v*`.
- Block deletion.
- Block force updates.
- When possible, allow only release automation to create release tags.
