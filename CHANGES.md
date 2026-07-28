## Changes in version 0.1.1 (in development)

### Fixes

- Nullable fields with a `default` value of `null` can now be enabled and
  initialized with a suitable non-null value. (#62)
- The app can now be served from dynamic base paths, such as those used by
  Jupyter Server Proxy, without failing to load its static assets. (#58)
- Service requests to loopback URLs can now be routed through a configured
  browser-visible proxy, enabling remote Jupyter deployments to reach local
  API endpoints. (#58)

## Changes in version 0.1.0

Initial version used in Eozilla 0.2.x.
