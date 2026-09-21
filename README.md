# SRM Telsa — Sistema de gestión

Sistema interno de Sanremo de México para Ventas, Compras, Producción, Almacén,
Transformadores y Finanzas. React + Vite + Firebase (Firestore, Auth, Hosting).

## Requisitos

- Node.js 24+
- Una cuenta con acceso al proyecto de Firebase (pide las credenciales a quien administra el proyecto)

## Configuración local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y llenar las variables con la configuración del
   proyecto de Firebase (Consola de Firebase → Configuración del proyecto → tus apps):

   ```bash
   cp .env.example .env
   ```

3. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Scripts disponibles

| Comando            | Qué hace                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga en caliente                   |
| `npm run build`     | Build de producción a `dist/`                                    |
| `npm run preview`   | Sirve el build de `dist/` para probarlo localmente                |
| `npm run lint`      | Lint con oxlint                                                  |
| `npm test`          | Corre las pruebas automatizadas (vitest)                         |
| `npm run seed`      | Siembra datos base en Firestore (requiere `scripts/serviceAccountKey.json`) |

## Roles y acceso

El acceso se controla por documento en `usuariosAutorizados/{email}` (ver
`firestore.rules`): cada usuario tiene `roles` (áreas a las que puede escribir) y
`rolesSoloLectura` (áreas que puede ver pero no modificar). Un admin gestiona esto
desde el panel de Usuarios dentro de la app — no hace falta tocar Firestore a mano
para dar de alta a alguien nuevo.

## Despliegue

El hosting es Firebase Hosting (`firebase.json`). Para desplegar:

```bash
npm run build
firebase deploy --only hosting
```

Reglas de Firestore/Storage se despliegan aparte:

```bash
firebase deploy --only firestore:rules,storage
```

## Integración continua

Cada push/PR corre lint, pruebas y build en GitHub Actions
(`.github/workflows/ci.yml`). Un PR con la CI en rojo no debería mezclarse a `main`.

## Estructura del proyecto

```
src/
  modules/<area>/   Páginas, hooks de datos y acciones por área de negocio
  lib/               Utilidades compartidas (Firebase, toasts, notificaciones, formatos)
  components/        Componentes de UI reutilizables entre módulos
  layout/            Layout general de la app (nav, header)
```

Cada módulo sigue el mismo patrón: `usePágina.js` (hook con el `onSnapshot` de
Firestore), `páginaActions.js` (mutaciones/transacciones) y los componentes de
la página en sí.
