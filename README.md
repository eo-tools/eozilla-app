# Eozilla App

A simple frontend for web services compliant with the
[OGC API - Processes](https://github.com/opengeospatial/ogcapi-processes).

![Screenshot](docs/images/eozilla-app.png)

## Module layout

```
- src/
  |- components/   # React components
  |- service/      # OGC API - Processes
  |- state/        # State types + storage
  |- store/        # Zustand state store (store, actions, hooks)  
  |- utils/        # General utilites
  \- main.tsx/     # Entry point modules
```


## Development

Setup Eozilla for the wraptile dev server:

```bash
cd projects
git clone https://github.com/eo-tools/eozilla.git
cd eozilla
pixi install
cd ..
```

Run Eozilla App:

```bash
cd projects
git clone https://github.com/forman/eozilla-app.git
cd eozilla-app
npm install
```

Run the app with dev server enabled:

```bash
npm run dev-server
npm run dev
```

After any code changes:

```bash
npm run typecheck
npm run format
npm run lint
```

Build the app:

```bash
npm run build
```
