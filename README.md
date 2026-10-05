# angular-starter-template

Plantilla base para iniciar nuevos proyectos frontend con **Angular**. Incluye una estructura de carpetas organizada, un layout principal, autenticación base, soporte PWA y una librería interna de componentes reutilizables (**db-ui-kit**). Así cada proyecto nuevo arranca con la misma base y no hay que configurarlo desde cero.

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| [Angular](https://angular.dev) | 21.2 | Framework principal (componentes standalone, router, forms) |
| [Angular CDK](https://material.angular.dev/cdk) | 21.2 | Utilidades de UI (overlays, accesibilidad, etc.) |
| Angular Service Worker | 21.2 | Soporte PWA / funcionamiento offline |
| [TypeScript](https://www.typescriptlang.org) | 5.9 | Lenguaje |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Estilos utilitarios (vía PostCSS) |
| [RxJS](https://rxjs.dev) | 7.8 | Programación reactiva |
| [ng-packagr](https://github.com/ng-packagr/ng-packagr) | 21 | Compilación de la librería `db-ui-kit` |
| [flatpickr](https://flatpickr.js.org) | 4.6 | Selector de fechas |
| [Quill](https://quilljs.com) | 2 | Editor de texto enriquecido |
| [Material Symbols](https://fonts.google.com/icons) | 0.47 | Iconografía |
| Vitest / Jasmine | — | Pruebas unitarias |

## Librería de componentes `db-ui-kit`

Ubicada en `projects/db-ui-kit`, se compila con ng-packagr y la aplicación la consume. Incluye:

- **Formularios:** `db-textbox`, `db-text-area`, `db-numberbox`, `db-selectbox`, `db-multi-select`, `db-checkbox`, `db-radio`, `db-switch`, `db-date-picker`, `db-file-input`, `db-html-editor`
- **Visualización:** `db-button`, `db-badge`, `db-card`, `db-data-table`, `db-gallery`, `db-tooltip`, `db-loader`
- **Feedback y diálogos:** `db-modal`, `db-alert-modal`, `db-confirm-modal`, `db-toast`

Puedes ver todos los componentes en funcionamiento en la página de demo (`src/app/pages/components-demo`).

## Requisitos previos

- **Node.js** `^20.19`, `^22.12` o `^24`
- **npm** 11 o superior
- **Angular CLI** (opcional en global): `npm install -g @angular/cli`. También puedes usar `npx ng`.

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/angular-starter-template.git
cd angular-starter-template

# 2. Instalar dependencias
npm install
```

> Si `npm install` muestra un error `ERESOLVE` por dependencias peer, ejecuta:
> ```bash
> npm install --legacy-peer-deps
> ```

## Arranque en local

```bash
npm start
```

Este comando compila primero la librería `db-ui-kit` y después levanta el servidor de desarrollo en **http://localhost:4200**.

Para acceder desde otros dispositivos de tu red local (por ejemplo, un celular):

```bash
npm run start:red
```

### Desarrollo de la librería

Si vas a modificar componentes de `db-ui-kit`, deja la librería en modo watch en una terminal y el servidor en otra:

```bash
# Terminal 1
npm run watch:lib

# Terminal 2
npx ng serve
```

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm start` | Compila `db-ui-kit` y levanta `ng serve` |
| `npm run start:red` | Igual que `start`, pero expuesto en la red (`--host 0.0.0.0`) |
| `npm run build:lib` | Compila solo la librería `db-ui-kit` en `dist/db-ui-kit` |
| `npm run watch:lib` | Compila la librería en modo watch (desarrollo) |
| `npm run build` | Compila la librería y la aplicación para producción en `dist/layout-lib` |
| `npm test` | Ejecuta las pruebas unitarias |

## Estructura del proyecto

```
├── projects/
│   └── db-ui-kit/          # Librería de componentes reutilizables
├── public/                 # Assets públicos (iconos, manifest PWA)
├── src/
│   ├── app/
│   │   ├── common/         # Componentes comunes (p. ej. selector de tema)
│   │   ├── core/           # Guards y servicios singleton
│   │   ├── features/       # Módulos funcionales (p. ej. auth)
│   │   ├── layout/         # Layout principal de la aplicación
│   │   ├── pages/          # Páginas (home, demo, components-demo, not-found)
│   │   └── shared/         # Componentes, interfaces, servicios y utilidades compartidas
│   ├── assets/
│   └── styles.css          # Estilos globales + Tailwind
├── angular.json
└── package.json
```

## Usar como plantilla para un nuevo proyecto

1. En GitHub, pulsa **"Use this template"** (o clona el repositorio).
2. Cambia el `name` en `package.json`.
3. Renombra el proyecto `layout-lib` en `angular.json`, incluidas las referencias `buildTarget` (`layout-lib:build:...`).
4. Ejecuta `npm install` y `npm start`.

Para más detalles sobre la configuración PWA, consulta [PWA.md](PWA.md).
