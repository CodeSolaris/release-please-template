# Local Commit Workflow

Use Conventional Commits for commit messages and pull request titles.

Examples:

```text
feat(api): add billing usage endpoint
fix(ci): keep release job behind validation
docs: document repository rulesets
```

Install dependencies and Git hooks once after cloning:

```sh
pnpm install
pnpm exec lefthook install
```

Lefthook runs commitlint for every new commit message. CI validates the pull
request title separately because squash merge uses it as the final commit
message on `main`.
