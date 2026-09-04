# How to contribute

The Eozilla App project welcomes contributions of any form, as long as you respect our [Code of Conduct](CODE_OF_CONDUCT.md) and follow these guidelines.

If you have suggestions, ideas, feature requests, or have found a bug, please [open an issue](https://github.com/eo-tools/eozilla-app/issues).

If you would like to submit code or documentation changes, please open a [pull request](https://github.com/eo-tools/eozilla-app/pulls). Code and configuration changes should be linked to a corresponding issue.

## Development workspace

For team development, use Eozilla App as a separate Git checkout nested inside
the Eozilla repository:

```text
eozilla/
  eozilla-app/
```

This layout allows the app to run against the local Eozilla development service
and build into Cuiman. The setup commands are in the
[README](README.md#team-development-workspace).

## Pull request checklist

Before opening a pull request, make sure that all applicable items below are complete:

- [ ] The pull request is linked to a corresponding issue.
- [ ] Code is formatted by running `npm run format`.
- [ ] Type checking and linting pass by running `npm run checks`.
- [ ] Tests pass by running `npm run tests`.
- [ ] A production build succeeds by running `npm run build`.
- [ ] Tests were added or updated for behavior changes.
- [ ] Substantial code changes are reflected in the relevant canonical app
      documentation under `../docs/eozilla-app/`, including the README where
      relevant.

## Code style

We use [Prettier](https://prettier.io/) to format code and [ESLint](https://eslint.org/) to identify code-quality issues.

Use `npm run format` and `npm run checks` to run these tools in a well-defined way.

Use TypeScript types for public interfaces and keep OGC API - Processes terminology consistent throughout the application.
