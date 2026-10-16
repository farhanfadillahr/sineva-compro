# Contributing

## Branch names

Name branches with a work type followed by a short, lowercase kebab-case description:

```text
<type>/<short-description>
```

Use the same type vocabulary as Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`. Add a ticket key after the type when it helps identify the work.

Examples:

- `feat/phone-3d-mockups`
- `fix/sino-hand-collision`
- `docs/copywriting-guidelines`
- `chore/cpr-104-update-tooling`

Do not put a person's name or username in the branch name. Keep one slash, after the type. Match the branch type to the main purpose of its commits.

## Commit messages and pull request titles

Use [Conventional Commits](https://www.conventionalcommits.org/) for every commit and pull request title:

```text
<type>[optional scope][!]: <short imperative description>
```

Use a lowercase type and optional lowercase scope. Keep the description specific, use the imperative, and omit the final period. Avoid vague messages such as `update`, `changes`, or `misc`.

Examples:

- `feat(phone): add 3D phone mockups`
- `fix(mascot): keep the hand clear of the torso`
- `docs(copy): describe Sino as a friendly companion`
- `chore(repo): standardize branch naming`

Use `!` for a breaking change, such as `feat(api)!: rename the public endpoint`, and include a `BREAKING CHANGE:` footer explaining its impact. Keep commits focused so each message describes one coherent change. Use the pull request title as the squash commit message.

## Pull requests

Open pull requests against `main`. Summarize the user-visible or operational change and list the checks you ran. Keep unrelated changes out of the pull request.
