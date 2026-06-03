# Features

- [ ] Add real UI-generator that generates a UI for a given input schemas. 
  We currently use `JSONInput` for all input schemas.
- [ ] Equip the JOBS and PROCESSES panels with search, sort, and filter features.
- [x] Make the app GDPR-compliant. Just the bare minimum.
- [ ] Implement OAuth flows for the service provider auth types != `"none"`.
- [ ] Show notification on job termination (success, failed, dismissed)
- [ ] Import/export process requests JSON files.
- [ ] Copy process request to clipboard. 
- [ ] Edit current process request as JSON code.
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

- [x] "Results" and "Info" in the `JobsPanel` as well as "Inputs" and "Outputs"
  in the `ProcessPanel` should use a new common `SubPanel` component.
- [x] Combine panels "Job Results" and "Job Info" into one "Job" panel
  That displays job info and job results (one available). Maybe use 
  `Accordion` component.
- [x] Use better styling. Get rid of the thin-line layout, replace by
  rounded panels with darker (dark mode) or lighter (light mode) background.


# Architecture & Design

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
