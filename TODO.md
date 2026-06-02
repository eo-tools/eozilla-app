# Features

- [ ] Add real UI-generator from schemas.
- [ ] Add OUTPUTS section to `ProcessPanel`.
- [ ] Equip the JOBS and PROCESSES panels with search, sort, and filter features.
- [ ] Make the app GDPR compliant.
- [ ] Validate incoming data, see TODOs in `src/service/services/url.ts`.
  Currently, we use JSON-inputs for any schema.
- [ ] Implement OAuth flows for the service provider auth types != `"none"`.
- [ ] Show notification on job termination (success, failed, dismissed)
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


# Styling

- [x] Combine panels "Job Results" and "Job Info" into one "Job" panel
  That displays job info and job results (one available). Maybe use 
  `Accordion` component.
- [x] Use better styling. Get rid of the thin-line layout, replace by
  rounded panels with darker (dark mode) or lighter (light mode) background.


# Design

- [x] Move `actions.ts`, `hooks.ts`, `store.ts` from `state` into `store`.
  Module `store.ts` should depend on `state.ts` but not the other way round.
  
