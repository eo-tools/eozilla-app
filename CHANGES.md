## Changes in version 0.1.1

### Enhancements

- The Custom Service provider now supports no authentication, manually supplied
  token authentication (Bearer or a custom header), and browser-based Login or
  OAuth2 authentication.
- Browser authentication supports OAuth 2.0 Authorization Code with PKCE and
  OpenID Connect discovery. Access tokens are refreshed automatically when a
  refresh token is available.
- Custom Service authentication forms now show only fields relevant to the
  chosen method and prevent sign-in until the required fields are supplied.
- The app title, favicon, and header icon are now configurable via the
  `VITE_APP_TITLE`, `VITE_APP_FAVICON`, and `VITE_APP_ICON` env vars, and
  the Custom Service form's default API URL, authentication type, client ID,
  authorization server URL, and OAuth2 protocol via `VITE_DEFAULT_SERVICE_*`
  env vars. Downstream consumers (e.g. S2GOS) can build a rebranded bundle
  with their own `.env.<mode>` file and `vite build --mode <mode>.
- When generating titles for input fields without a title set, we skip a 
  prefix `x-` from the input's name before converting it. (#74)


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
