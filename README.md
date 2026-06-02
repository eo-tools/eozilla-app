# Eozilla App

A simple frontend for web services compliant with the
[OGC API - Processes](https://github.com/opengeospatial/ogcapi-processes).

![Screenshot](docs/images/eozilla-app.png)

## Module layout

```
- src/
  |- components/   # React components
  |- service/      # OGC API - Processes
  |- state/        # State types and local storage
  |- store/        # Zustand state store (store, actions, hooks)  
  |- utils/        # General utilites
  \- main.tsx      # Entry point module
```


## Development

Setup eozilla so we can use wraptile as dev server:

```bash
cd projects
git clone https://github.com/eo-tools/eozilla.git
cd eozilla
pixi install
cd ..
```

Setup eozilla-app:

```bash
cd projects
git clone https://github.com/forman/eozilla-app.git
cd eozilla-app
npm install
```

Run eozilla-app with dev server (select option "Dev Service" on startup):

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
