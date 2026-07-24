# Contributing to @7n7d/cli

Thanks for your interest in contributing to the 7N7D CLI!

## Setup

This repo depends on `@7n7d/sdk` via a `file:../sdk` reference, so you need
the SDK checked out as a sibling directory before installing:

```bash
git clone https://github.com/7N7Dai/sdk.git ../sdk
git clone https://github.com/7N7Dai/cli.git
cd cli
npm install
npm run build  # also builds ../sdk transitively via tsup
npm test
```

> The CI workflow (`.github/workflows/ci.yml`) does this automatically by
> checking out `7N7Dai/sdk` into `../sdk` and building it before running
> the CLI's checks.

## Workflow

1. Fork the repository.
2. Create a feature branch off `main`:
   ```bash
   git checkout -b feat/<short-description>
   ```
3. Make your changes. Add or update tests for any new command or option.
4. Ensure all checks pass locally:
   ```bash
   npm run build
   npm test
   ```
5. Push and open a Pull Request against `main`.
6. Address review feedback from CODEOWNERS.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) so the
release workflow (`.github/workflows/release.yml`) can determine the next
version and generate changelog entries automatically.

```
feat: add `7n7d unwrap` to withdraw ERC-7710 delegated funds
fix(config): fall back to $HOME/.7n7d when XDG_CONFIG_HOME is unset
docs: document the `--network` flag in README
```

## Releases

Releases are automated via `release-please`. Conventional commit messages
on `main` drive the version bump and publish to npm under the `@7n7d` scope.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/).
Be respectful, assume good faith, and focus on the work.

## Security

For vulnerability disclosures, see [`SECURITY.md`](./SECURITY.md) (if present)
or email security@7n7d.com. Please **do not** file public issues for security
bugs.