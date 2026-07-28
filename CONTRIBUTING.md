# How to contribute

The Eozilla App project welcomes contributions of any form, as long as you respect our [Code of Conduct](CODE_OF_CONDUCT.md) and follow these guidelines.

If you have suggestions, ideas, feature requests, or have found a bug, please [open an issue](https://github.com/eo-tools/eozilla-app/issues).

If you would like to submit code or documentation changes, please open a [pull request](https://github.com/eo-tools/eozilla-app/pulls). Code and configuration changes should be linked to a corresponding issue.

## Pull request checklist

Before opening a pull request, make sure that all applicable items below are complete:

- [ ] The pull request is linked to a corresponding issue.
- [ ] Code is formatted by running `npm run format`.
- [ ] Type checking passes by running `npm run typecheck`.
- [ ] Linting passes by running `npm run lint`.
- [ ] Tests pass by running `npm run test`.
- [ ] A production build succeeds by running `npm run build`.
- [ ] Tests were added or updated for behavior changes.
- [ ] Documentation, including the README where relevant, was updated for user-facing changes.

## Code style

Use Prettier to format code and ESLint to identify code-quality issues.

Keep changes small and focused. Place component work in `src/components`, service integration work in `src/service`, shared application state in `src/store`, and persisted state in `src/state`.

Use TypeScript types for public interfaces and keep OGC API - Processes terminology consistent throughout the application.