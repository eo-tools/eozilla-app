# Eozilla App implementation status

Last audited: 2026-09-03.

This file records the remaining work in the current implementation. Completed
items from the earlier backlog are summarized below so that the open work can
be extracted into feature requests later. `[~]` denotes a partial
implementation that needs follow-up.

## Implemented since the earlier backlog

- [x] Authentication for custom services: token, login, OAuth2/OIDC
  authorization-code flows with PKCE, client credentials, Basic auth, and API
  keys.
- [x] Import and export of process-request JSON files, including schema-aware
  validation when importing.
- [x] Process-request JSON editing, output copy/view/download actions, job
  traceback display and copying, and Mantine error notifications.
- [x] Search, sorting, and filtering for process and job lists.
- [x] Service-provider option forms and stepper-based sign-in flow.
- [x] Cuiman-launched, compact, and remote-state modes, including the bundled
  Cuiman app build.
- [x] Privacy notice, application icon, split panels, subpanels, and refreshed
  panel styling.
- [x] Schema-form support for primitive values, array input/editor modes,
  oneOf/anyOf/allOf, discriminators, nullable values, WKT and bbox map inputs,
  dynamic expressions, and the schema2ui playground.
- [x] Date, date-time, and time controls for scalar strings; date and
  date-time arrays are supported as separator-based text inputs.
- [x] A fixture-per-schema-file schema2ui playground with individual scrolling
  panels and a color-scheme switch.
- [x] Unit tests for core utilities, configuration, service providers, schema
  normalization, and selected component/store helpers; CI runs type checking,
  linting, and tests.

## Known issues requiring browser verification

- [ ] Reproduce and diagnose the recurring `[Violation] 'setTimeout' handler
  took <N>ms` console message (previously observed at roughly 50–100 ms).
- [ ] Reproduce and diagnose the occasional `<p> cannot contain a nested
  <div>` console warning. The previous nested-button warning is no longer
  present in the current source audit.

## Pending application features

- [ ] Add branding configuration for the default service provider and its
  options, plus application title, icon, and URL.
- [ ] Notify users when a job reaches a terminal state (successful, failed, or
  dismissed).
- [ ] Add an action to copy the complete current process request to the
  clipboard. Individual job outputs and job data can already be copied.
- [ ] Include the submitting user identity in process requests and restrict the
  displayed jobs accordingly. Providers now expose `UserIdentity`, but the
  request and job models do not carry it.

## Architecture and robustness

- [ ] Persist Process and Job subpanel open states in the app state. They are
  currently component-local state.
- [ ] Establish and apply the intended primary/secondary/common component
  boundaries; the current component tree does not enforce these categories.
- [ ] Validate data returned by URL services as `ProcessList`,
  `ProcessDescription`, `JobList`, `JobInfo`, `JobResults`, and
  `ServiceMetadata`. The explicit TODOs remain in
  `src/service/services/url.ts`.
- [ ] Implement path-selective subscriptions for dynamic expressions. The
  current controlled-value provider is correct, but rerenders all expression
  consumers when the root form value changes.

## Testing and maintenance

- [ ] Expand direct tests for store actions/hooks and rendered components.
  Existing coverage includes selected helpers and schema factories, but many
  stateful UI components still have no dedicated test.
- [ ] Add regression tests for the browser-console warnings once they are
  reproducible.

## Schema-form follow-up

- [ ] Add dedicated date/date-time array pickers or range controls; the
  current separator-based input is functional but not date-aware.
- [~] General `$ref` resolution: schema2ui fixtures resolve local references,
  but process-schema normalization does not yet resolve them generically.
- [ ] Support `prefixItems` / tuple schemas.
- [ ] Support file/bytes inputs and a file-drop widget.
- [ ] Support discrete sliders for numeric enums with `x-ui-widget: slider`.
- [ ] Add an editor for object `additionalProperties`; such objects currently
  fall back to the raw JSON editor.
- [ ] Render group titles/styles and support `group_name` metadata. Nested row
  and column layouts work, but group presentation metadata is not rendered.
- [~] Decide whether a TypeScript equivalent of Python's `FieldFactoryBase` is
  needed. A `FieldFactory` interface and registry already exist, but not a
  direct base-class equivalent.
- [ ] Reach full validation parity with the Python/OpenAPI behavior.
- [~] Verify and align initial-value behavior with Python. Defaults, enums,
  primitive values, arrays, objects, and schema compositions have defined
  initial values, but parity is not established.
- [ ] Prevent separator-based array inputs from reformatting while the user is
  typing, and add an explicit formatting action.
- [ ] Make nested objects more visually distinct.
- [ ] Support map background-layer configuration through `x-ui` metadata, such
  as `x-ui-bg_layer_url`, `x-ui-bg_layer_url_dark`, and
  `x-ui-bg_layer_url_light`.
