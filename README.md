# Eozilla App

[![CI](https://img.shields.io/github/actions/workflow/status/eo-tools/eozilla-app/ci.yml?branch=main&style=flat-square)](https://github.com/eo-tools/eozilla-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vite.dev/)

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
