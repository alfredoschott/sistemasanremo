# Progreso — SRM Telsa Transformadores

Este archivo resume el estado del proyecto para retomar el trabajo en
cualquier sesión nueva sin depender del historial de chat. Contexto de
negocio completo en `CLAUDE.md` (en este mismo repo, si se copió) o en el
documento original del proyecto.

## Hecho

- **Setup**: Vite + React 19 + Tailwind v4 + Firebase SDK + React Router.
- **Firebase**: proyecto real creado — `sistema-sanremo`, Firestore edición
  Standard, región `us-central1`/`us-east1` (confirmar cuál se eligió).
  Reglas de seguridad publicadas (`firestore.rules`): solo usuarios
  autenticados pueden leer/escribir, sin roles por área todavía.
- **Auth**: login con Google (`signInWithPopup`) funcionando end-to-end.
  Estructura en `src/lib/authProviders.js` lista para sumar Microsoft
  después (agregar una entrada al array + habilitar el proveedor en la
  consola de Firebase Auth).
- **Layout**: topbar (verde marca `#1f5e50`) + sidebar con los 4 módulos.
- **Módulo Ventas** (completo): listar cotizaciones (tabla con badges de
  estado), crear cotización (modal con condición de pago: anticipo % o
  crédito Fudeco 60-90 días), ver detalle con timeline de estados
  (`Cotizado → OF abierta → Producción → Facturado`). Todo con listeners
  `onSnapshot` en tiempo real.
- **Módulo Compras** (completo): sección "Cotizaciones por abrir OF"
  (lista cotizaciones en estado `Cotizado` con botón "Abrir OF" — asigna
  proveedor + plazo 15-30 días, genera número de serie `OF-YYYY-XXXXXX`,
  crea el doc en `/ordenesFabricacion` y actualiza la cotización a
  "OF abierta" con `writeBatch` atómico). Sección "Órdenes de compra"
  (listar + crear O.C. con proveedor, líneas de material/cantidad, plazo,
  estado pendiente/recibida). `ProveedorPicker`/`useProveedores` maneja
  la colección `/proveedores` compartida (permite crear proveedor inline
  al vuelo desde cualquiera de los dos formularios).
- **Placeholders**: Producción, Almacén (solo mensaje "próxima fase", sin
  lógica).
- Datos de prueba ya sembrados en Firestore real (`npm run seed` corrido
  con éxito: 3 clientes, 3 cotizaciones).
- Repo git local inicializado con commits por feature.

## Pendiente / próximos pasos

1. **Módulo Producción** (OF — orden de fabricación): mostrar avance de
   las OF abiertas (ya se crean desde Compras), consumo de BOM, timeline
   de estados propio.
2. **Recepción de O.C.**: falta el botón "Marcar recibida" en Compras —
   se dejó pendiente a propósito porque sumar stock en `/materiales`
   pertenece al módulo Almacén (usar `runTransaction`, no `update`
   simple, por la condición de carrera real entre módulos).
3. **Módulo Almacén**: catálogo de materiales + stock, movimientos de
   entrada/salida. Riesgo a mitigar activamente: toda operación que
   sume/reste stock debe usar `runTransaction` de Firestore (condición de
   carrera real con 4 módulos conectados), nunca un `update` simple.
4. **Cloud Functions** (automatizaciones): OC recibida → suma stock; OF
   abierta → resta stock o marca "en espera de material"; stock bajo
   mínimo → sugiere/genera borrador de O.C.
5. **Roles por área** — sin definir con Sanremo todavía. Hoy cualquier
   usuario autenticado puede escribir en cualquier colección.
6. **CFDI/facturación fiscal** — fuera del MVP a propósito. Solo registrar
   monto y referencia a la OF; integración a un PAC (Facturama, SW Sapien)
   es fase futura.

## Decisiones tomadas en esta fase

- Orden de construcción del MVP: Ventas → Compras → Producción → Almacén
  (confirmado con el usuario).
- Auth: Google como único proveedor por ahora; Microsoft se agrega
  después sin rehacer nada, solo sumar una entrada.
- Firestore edición Standard (no Enterprise) — no se necesitan
  canalizaciones ni MongoDB.
- Seed de datos usa `firebase-admin` con service account (no auth
  anónima), porque el único método de login habilitado es Google.

## Comandos útiles

```bash
npm run dev      # servidor de desarrollo (localhost:5173)
npm run build    # build de producción
npm run seed     # carga clientes y cotizaciones de prueba (requiere serviceAccountKey.json)
npx firebase login   # login del CLI para desplegar reglas/hosting
```
