## Changes in version 0.1.1 (in development)

### Added

- The Custom Service provider now supports no authentication, manually supplied
  token authentication (Bearer or a custom header), and browser-based Login or
  OAuth2 authentication.
- Browser authentication supports OAuth 2.0 Authorization Code with PKCE and
  OpenID Connect discovery. Access tokens are refreshed automatically when a
  refresh token is available.
- Custom Service authentication forms now show only fields relevant to the
  chosen method and prevent sign-in until the required fields are supplied.

### Fixes

- Custom-service passwords, API keys, client secrets, and tokens are kept in
  browser session storage instead of local storage. They remain available after
  a reload in the same tab, but must be entered again in a new browser session.
- Generated string inputs now report `minLength` validation errors, and invalid
  process inputs are rejected locally before execution. (eo-tools/eozilla#105)
- Nullable fields with a `default` value of `null` can now be enabled and
  initialized with a suitable non-null value. (#62)
- The app can now be served from dynamic base paths, such as those used by
  Jupyter Server Proxy, without failing to load its static assets. (#58)
- Service requests to loopback URLs can now be routed through a configured
  browser-visible proxy, enabling remote Jupyter deployments to reach local
  API endpoints. (#58)

## Changes in version 0.1.0

Initial version used in Eozilla 0.2.x.
