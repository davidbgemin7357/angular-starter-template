# PWA (aplicación instalable)

Esta base ya es una **Progressive Web App**: en Android (Chrome/Edge) y en escritorio el
navegador ofrece instalarla, y en iOS se puede agregar a la pantalla de inicio. Una vez instalada
se abre en su propia ventana, con su ícono, y el "cascarón" de la app carga desde caché.

## Cómo funciona

El navegador ofrece instalar cuando se cumplen tres requisitos:

| Requisito | Dónde está |
|---|---|
| Servida por **HTTPS** (o `localhost`) | Depende del servidor donde se despliegue |
| **Manifest** con nombre, íconos 192/512 y `display: standalone` | `public/manifest.webmanifest` |
| **Service worker** registrado | `ngsw-config.json` + `provideServiceWorker` en `src/app/app.config.ts` |

Cuando se cumplen, Chrome/Edge disparan `beforeinstallprompt`. `PwaInstallService`
(`src/app/shared/pwa/`) lo captura y `PwaPromptComponent` (montado en `app.html`) muestra un aviso
propio con **Instalar** / **Ahora no**. Si el usuario elige "Ahora no", no se vuelve a mostrar
durante 7 días.

iOS/Safari no tiene ese evento: ahí el aviso muestra las instrucciones
(Compartir → **Agregar a pantalla de inicio**).

`PwaUpdateService` detecta cuando se publicó una versión nueva y muestra
**Hay una nueva versión → Recargar**. Sin esto, una app instalada seguiría usando la versión en caché.

## Qué personalizar al crear un proyecto nuevo

1. `public/manifest.webmanifest`: `name`, `short_name`, `description`, `theme_color`, `background_color`.
2. `src/index.html`: `<meta name="theme-color">`, `<meta name="description">`, `apple-mobile-web-app-title`.
3. `public/icons/`: reemplazar los íconos por el logo del proyecto, con los mismos nombres y tamaños
   (72 a 512 px). Deben ser PNG cuadrados; para Android deja un margen de ~10 % alrededor del logo,
   porque se recortan en círculo (`purpose: maskable`).
4. `ngsw-config.json`: si la app debe mostrar datos sin conexión, agrega un `dataGroups` para esas
   URLs de la API. Por defecto **no se cachea ninguna llamada a la API**, para no mostrar datos o
   sesiones desactualizadas.

## Probar

El service worker **no se activa con `ng serve`** (solo en builds de producción).

```bash
ng build
npx http-server dist/layout-lib/browser -p 8080 -c-1
```

Abre `http://localhost:8080` en Chrome → DevTools → **Application**:
- **Manifest**: sin errores, con los íconos.
- **Service workers**: `ngsw-worker.js` activo.
- Debe aparecer el ícono de instalar en la barra de direcciones y el aviso propio abajo a la derecha.

En el celular hace falta **HTTPS**: despliega en el servidor real o usa un túnel (p. ej. ngrok)
hacia el puerto 8080.

Para probar el aviso de actualización: cambia algo, vuelve a hacer `ng build` y recarga la página
servida; tras unos segundos aparece "Hay una nueva versión".
