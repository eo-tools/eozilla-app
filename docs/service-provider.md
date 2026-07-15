# Service Providers and Services

This document explains how `ServiceProvider` and `Service` work together in
Eozilla, how a user selects a provider, and how sign-in can hand control to an
external web page before the app creates the actual service instance.

## Main Concepts

The service layer is split into two roles:

- `ServiceProvider` describes a selectable service backend and owns the
  sign-in/sign-out lifecycle for that backend.
- `Service` is the connected, user-specific API client used by the rest of the
  application to list processes, execute processes, inspect jobs, and fetch job
  results.

The relevant interfaces live in:

- `src/service/provider.ts`
- `src/service/service.ts`

Provider implementations are registered through `src/service/registry.ts`.
The app registers the built-in providers during startup in `src/main.tsx`.

## ServiceProvider

`ServiceProvider<TOptions>` is the app-facing contract for a backend that can
produce a `Service`.

```ts
interface ServiceProvider<T extends ServiceOptions = NoServiceOptions> {
  id: string;
  meta: ServiceProviderMeta;
  optionsSchema?: ServiceOptionsSchema<T>;
  signIn(options: ServiceOptionsInput<T>): Promise<void>;
  signOut(): Promise<void>;
  createService(options: ServiceOptionsInput<T>): Promise<Service>;
}
```

### `id`

The stable provider identifier. It is stored in local storage as part of the
user's provider selection and is later used to look the provider up again in the
registry.

### `meta`

Display metadata for the service dialog. `meta.title`, `meta.description`,
`meta.type`, `meta.disabled`, and `meta.hidden` decide how the provider appears
in the provider list.

### `optionsSchema`

An optional schema describing configuration values the user must enter before
sign-in. The service dialog converts this schema into a form and passes the
normalized values to `signIn()` and later to `createService()`.

Examples are API URL, token header name, token value, or any future OAuth/OIDC
configuration required by a provider.

### `signIn(options)`

Called from a user-triggered action after a provider has been selected and its
options have been submitted.

This method is allowed to:

- do nothing and resolve immediately, as the current test/dev/custom providers
  do;
- open a popup;
- redirect the current page to an external sign-in page;
- store provider-specific temporary auth state before redirecting.

The app stores the selected provider id and options before calling
`provider.signIn(options)`. This is intentional: if `signIn()` redirects away
from Eozilla, JavaScript execution stops at that point and the later
`setAppState({ serviceProviderId })` line may never run.

### `signOut()`

Called when the user disconnects the current service. The provider can clear
local credentials, revoke a session, or redirect to a logout page. Just like
`signIn()`, this method may also end app execution by redirecting.

### `createService(options)`

Called after sign-in has completed, including after any external redirects. It
is responsible for collecting the sign-in result, resolving the user identity,
and returning a connected `Service` instance.

For redirect-based providers, this method is where the provider should inspect
provider-owned state, callback parameters, session storage, cookies, or tokens
created by the external sign-in flow. The generic app code only stores the
provider selection and options; provider-specific sign-in information belongs in
the provider implementation.

## Service

`Service` is the connected API client used by UI panels and hooks after a
provider has produced it.

```ts
interface Service {
  providerId: string;
  user: UserIdentity;
  meta: ServiceMetadata;
  getProcesses(): Promise<ProcessList>;
  getProcess(processId: string): Promise<ProcessDescription>;
  executeProcess(processId: string, processRequest: ProcessRequest): Promise<JobInfo>;
  getJobs(): Promise<JobList>;
  getJob(jobId: string): Promise<JobInfo>;
  getJobResults(jobId: string): Promise<JobResults>;
  dismissJob(jobId: string): Promise<void>;
  close(): Promise<void>;
}
```

A service instance is already bound to:

- the provider that created it, via `providerId`;
- the signed-in user, via `user`;
- the service metadata loaded from the backend, via `meta`;
- any headers, tokens, base URLs, or other provider-specific connection state.

Application hooks should depend on `Service`, not on provider-specific auth
details. For example, process and job panels call methods such as
`getProcesses()`, `executeProcess()`, and `getJobResults()` without knowing how
the user authenticated.

## Selection and Sign-In Flow

The full flow is easier to read as a few smaller diagrams:

### Part 1: Provider Selection and Sign-In

```mermaid
sequenceDiagram
    actor User
    participant Dialog as Service Dialog
    participant Actions as store/actions.signIn
    participant Storage as localStorage
    participant Registry as Service Provider Registry
    participant Provider as ServiceProvider
    participant Auth as External Sign-In Page

    User->>Dialog: Select provider
    Dialog->>Dialog: Render options form from provider.optionsSchema
    User->>Dialog: Submit options
    Dialog->>Actions: signIn(providerId, options)
    Actions->>Registry: getServiceProvider(providerId)
    Registry-->>Actions: provider
    Actions->>Storage: Store { id: providerId, options }
    Actions->>Provider: signIn(options)

    alt Provider resolves without redirect
        Provider-->>Actions: Sign-in completed
        Actions->>Dialog: Set active serviceProviderId
    else Provider redirects or opens external sign-in
        Provider->>Auth: Redirect user to sign-in page
        Note over Actions,Auth: App execution may stop here
    end
```

### Part 2: App Startup Restores Selection

```mermaid
sequenceDiagram
    participant Auth as External Sign-In Page
    participant Storage as localStorage
    participant Startup as createInitialAppState
    participant Hooks as useLoadService
    participant Registry as Service Provider Registry
    participant Provider as ServiceProvider

    Auth-->>Startup: Redirect back to Eozilla
    Startup->>Storage: Restore stored provider selection
    Startup->>Hooks: App starts or resumes with serviceProviderId
    Hooks->>Registry: getServiceProvider(serviceProviderId)
    Registry-->>Hooks: provider
    Hooks->>Storage: Read stored options
    Hooks->>Provider: createService(options)
```

### Part 3: Service Creation and UI Reconnect

```mermaid
sequenceDiagram
    participant Provider as ServiceProvider
    participant Service as Service
    participant Hooks as useLoadService
    participant AppState as App State
    participant Dialog as Service Dialog
    actor User

    Provider->>Provider: Collect sign-in result and user identity
    Provider->>Service: Create connected Service(user, meta, auth state)
    Provider-->>Hooks: Service instance
    Hooks->>AppState: setService(service)
    AppState-->>Dialog: Connected service is available to UI hooks
    Dialog-->>User: Service connected
```

## What Happens in the App

1. The provider list is read from the registry with `getServiceProviders()`.
2. The service dialog shows non-hidden providers from that list.
3. When the user selects a provider, the dialog renders a configuration form
   from `provider.optionsSchema`.
4. When the user submits the form, `store/actions.signIn()`:
   - looks up the provider;
   - stores `{ id, options }` under `eozilla.serviceProviderSelection`;
   - calls `provider.signIn(options)`;
   - sets `serviceProviderId` only if control returns to the app.
5. If `provider.signIn()` redirects to another website, app execution can stop
   immediately after the provider call. This is expected behavior.
6. After the external sign-in redirects back to Eozilla, app startup restores
   the provider id from `eozilla.serviceProviderSelection`.
7. `useLoadService()` sees the restored `serviceProviderId`, reads the stored
   options, and calls `provider.createService(options)`.
8. `createService()` resolves the provider-specific sign-in result and user
   identity, loads service metadata if needed, and returns a `Service`.
9. The app stores that `Service` in app state and the rest of the UI uses the
   service methods.

## Provider Implementation Checklist

When adding a new provider:

1. Implement `ServiceProvider<TOptions>`.
2. Choose a stable `id`; changing it breaks persisted selections.
3. Fill `meta` with the user-facing title and optional description.
4. Add `optionsSchema` for values the user must provide before sign-in.
5. In `signIn()`, start the authentication flow. Persist any provider-specific
   temporary state before redirecting.
6. In `createService()`, finish or inspect the authentication result, derive the
   `UserIdentity`, create the concrete `Service`, and return it.
7. In `signOut()`, clear provider-owned credentials or sessions.
8. Register the provider with `registerServiceProvider()` or include it in the
   startup provider list.

## Current Built-In Providers

- `CustomServiceProvider` uses the URL service options and creates a
  `UrlService`. Its current `signIn()` is a no-op; token headers can be supplied
  through options.
- `DevServiceProvider` connects to `http://localhost:8008` with an anonymous
  user. Its `signIn()` and `signOut()` are no-ops.
- `TestServiceProvider` creates an in-memory test service for local development
  and tests.

These providers demonstrate the minimum contract. A real redirect-based
provider should use the same interface but move the auth-specific work into
`signIn()`, `signOut()`, and `createService()`.

## Responsibility Boundary

The application orchestrates provider selection, option collection, persisted
selection restore, and service loading.

The provider owns authentication details. That includes external redirects,
callback parsing, token exchange, session lookup, credential cleanup, and
mapping the authenticated principal to `UserIdentity`.

The service owns backend operations after authentication. UI code should call
the `Service` methods and avoid depending on how the provider authenticated the
user.
