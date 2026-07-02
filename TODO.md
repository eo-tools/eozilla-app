# Open issues

In the dev console we still have:

- [ ] Regular `[Violation] 'setTimeout' handler took <N>ms` with N being 50 to 100 ms
- [ ] Once `<p> cannot contain a nested <div>.`
- [x] Once `<button> cannot contain a nested <button>.`


# Features

- [ ] Allow running the app in an iframe in Jupyter notebooks. 
  - Derived app requirements:
    - [x] Accept query parameters that configure the app to use the same service data as the
      cuiman Python client.
    - [x] Allow for compact-mode, that is, e.g., no header, no footer.
    - [ ] Allow accessing the reactive state for the process requests in cuiman.
  - Derived cuiman requiremts:
    - [ ] Bundle the app build with cuiman.
    - [ ] Allow `client.show()` to open the app instead of the panel UI. 
    - [ ] Hold the reactive state for the process requests shown in the app.
- [ ] Implement OAuth flows for the service provider auth types != `"none"`.
- [ ] Only show the jobs that have been submitted by the authenticated user.
  See also related to-do in the design section below.
- [ ] Allow for some basic branding of the app. The branding configuration 
  should comprise:
  - the default service provider with its default configuration
  - the app title and icon and URL, which could all be included in
    service provider metadata
- [x] Add real UI-generator that generates a UI for a given input schemas. 
  We currently use `JSONInput` for all input schemas.
- [ ] Equip the JOBS and PROCESSES panels with search, sort, and filter features.
- [ ] Show notification on job termination (success, failed, dismissed)
- [ ] Import/export process requests JSON files.
- [ ] Copy process request to clipboard. 
- [ ] Edit current process request as JSON code.
- [x] Use colored syntax highlighting when showing raw JSON values.
- [x] Make the app GDPR-compliant. Just the bare minimum.
- [x] Add OUTPUTS section to `ProcessPanel`.
- [x] Make use of the Mantine `Stepper` component to represent the subsequent 
  steps in our `ServiceDialog`. 
  - [x] Set the `loading` state while creating the service.
  - [x] Show the server title, description, and its capabilities 
    (= root endpoint response).
- [x] Use Mantine's notification system to report errors.
- [x] Improve displaying the outputs of a successful job of type
  `JobResults`. Currently, we just show the individual field values
  of a named `JobResult` in a HTML table element. For each output have a
   - copy-to-clipboard action
   - view action that opens a viewer that can render based on MIME type or
     show the raw values (like now). 
   - download action (if result is a `Link`).
- [x] Component `src/comnponents/common/ResourceView` should nicely display
  a message (given as an optional prop) if the respective SWR key was `null`.
- [x] Show error info for failed jobs. Allow copying the traceback.
- [x] All adding service providers with or without options.
  Currently, we can only register optionless, inbuilt providers.


# UX, Layout, and Style

- [ ] Invent an app icon and use it in `index.html` instead of 
  `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`.
- [x] "Results" and "Info" in the `JobsPanel` as well as "Inputs" and "Outputs"
  in the `ProcessPanel` should use a new common `SubPanel` component.
- [x] Combine panels "Job Results" and "Job Info" into one "Job" panel
  That displays job info and job results (one available). Maybe use 
  `Accordion` component.
- [x] Use better styling. Get rid of the thin-line layout, replace by
  rounded panels with darker (dark mode) or lighter (light mode) background.


# Architecture & Design

- [ ] Process request submission should include the ID of the user
  who submitted it. Accordingly, the shown jobs should be the jobs of that 
  user. Currently, we have no means to reflect this in the app also because 
  the model does not represent user information neither `ProcessRequest` nor 
  in `JobInfo`.
- [ ] `SubPanel` opened states in `ProcessPanel` and `JobsPanel`
  should be part of the app state.
- [ ] Split components into three categories
  1. primary: connected to app state via hooks and actions
  2. secondary: used by primary, but configured by props only
  3. common: used by any other components, configured by props only
- [x] Move `actions.ts`, `hooks.ts`, `store.ts` from `state` into `store`.
  Module `store.ts` should depend on `state.ts` but not the other way round.


# Robustness, Maturity

- [ ] Validate incoming data, see TODOs in `src/service/services/url.ts`.
  Currently, we use JSON-inputs for any schema.


# Project maintenance

- [x] Add unit tests for all `*.ts` files including plain functions and classes.
  This should exclude `src/store` and `src/components` for time being.
- [ ] Add unit tests also for `src/store` and `src/components` after having decided how
  to do (a) app store, (b) hooks, (c) component testing. 
- [x] Setup GitHub CI which includes typecheck, lint, and testing. 



# Generator TODOs
### Array support
- [] array text input
- [] array editor
- [] add/remove/reorder UI
- [] separator handling
- [] date/date-time ranges
- [x] bbox/map editor for WKT strings
- [ ] bbox/map editor for 4-tuples of floats
### Schema composition:
- [] oneOf
- [] anyOf
- [] allOf
- [] discriminator support
- [] $ref resolution in TypeScript metadata.
- [] prefixItems / tuple conversion.
- [x] File/bytes inputs.
- [x] File dropper support.
- [ ] Persist selected filenames for bytes inputs across reloads
- [] Enum discrete slider for enum + x-ui-widget: slider.
- [] Additional-properties editor.
- [] Group titles/styles and group_name.
- [] TypeScript equivalent of Python FieldFactoryBase.
- [x] Schema playground like Python schema2ui.
- [] Full validation parity with the Python/OpenAPI behavior.
- [] Exact Python-style initial value behavior.

- [] finer grained schema files:
  - per schema type and anyOf, oneOf etc
  - per customization through x-ui and format
- [] grouped schema selection panel, e.g., a tree view, or nested menu
- [] panels should scroll individually
- [] color-mode switch for the playground
- [] array values should not auto-format while typing
  - provide a small format action on the right side of the label
- [] date-time input and picker should behave differently
- [] time picker should be a time input
- [] nested objects should be visually distinguishable
