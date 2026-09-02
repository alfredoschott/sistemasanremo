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
- **Módulo Producción** (completo): tarjetas por OF (número de serie,
  cliente, proveedor, plazo, estado). "Iniciar producción" (Abierta → En
  producción, sincroniza cotización a "Producción"), slider de avance %,
  "Completar y facturar" (cierra el ciclo: OF → Completada, cotización →
  Facturado).
- **Módulo Almacén** (completo): catálogo `/materiales` (nombre, stock,
  mínimo editable inline, badge "Bajo mínimo"). `MaterialPicker` mismo
  patrón que `ProveedorPicker` (crear material inline). Todo lo que
  suma/resta stock pasa por `runTransaction` en `stockActions.js`:
  `recibirOrdenCompra` (botón "Marcar recibida" en Compras, suma stock
  de todas las líneas y registra `/movimientosAlmacen`) y
  `registrarMovimientoManual` (ajustes manuales entrada/salida).
- Con esto el flujo de negocio completo funciona de punta a punta:
  cotización → abrir OF con proveedor → O.C. a proveedor → recibir O.C.
  (suma stock) → iniciar producción → avance → completar y facturar.
- Datos de prueba ya sembrados en Firestore real (`npm run seed` corrido
  con éxito: 3 clientes, 3 cotizaciones).
- **Renovación de interfaz** (completa): logo real del cliente en
  `src/assets/logo.png` (`BrandMark.jsx` lo muestra, versión compacta con
  chip blanco en el topbar por contraste sobre el verde oscuro). Paleta
  de verde ajustada al logo real. Componentes compartidos nuevos en
  `src/components/`: `Modal`, `Button`, `Skeleton`/`TableSkeleton`,
  `EmptyState` — los 5 modales y las 4 páginas de lista ya los usan en
  vez de markup duplicado. Sistema de toasts (`lib/ToastContext.jsx`)
  conectado a las acciones clave. Sidebar con íconos (`lucide-react`) y
  pastilla activa animada, transición de fade entre páginas, login
  rediseñado con fondo con textura. `EstadoBadge`/`Timeline` con más
  jerarquía visual (checkmarks, línea de progreso animada).
- **Edición y notificaciones**: cotizaciones editables mientras están
  "Cotizado", O.C. editables mientras están "pendiente" (mismos modales
  de creación, generalizados). Centro de notificaciones persistente
  (`/notificaciones` + `NotificationBell.jsx` en el topbar) que registra
  los eventos clave del sistema (nueva cotización, OF abierta, O.C.
  creada, avances de producción, avisos de stock bajo mínimo).
- **Métricas por módulo**: tarjetas KPI en Ventas/Compras/Producción/
  Almacén con datos reales (montos, conteos, promedios), inspiradas en
  el mockup HTML que el usuario ya tenía (`sistema_sanremo_demo.html`).
  Buscador por cliente en Ventas. Nombre de material editable inline en
  Almacén.
- Repo git local inicializado con commits por feature.

## Pendiente / próximos pasos

1. **Cloud Functions** (automatizaciones del lado servidor): hoy la
   suma/resta de stock corre client-side vía `runTransaction`, lo cual
   funciona pero no es a prueba de un cliente malicioso o con Firestore
   rules más laxas. Migrar a Cloud Functions da más control (ej. trigger
   al marcar O.C. recibida, resta automática al consumir BOM en
   Producción, sugerencia de O.C. cuando stock < mínimo).
2. **Consumo de BOM en Producción**: hoy Producción no resta stock del
   material — falta enlazar el catálogo de materiales de este sistema
   con el proyecto de tornillería/BOM que Yamil está armando por
   separado (ver contexto del proyecto), y que Producción reste stock al
   avanzar.
3. **Roles por área** — sin definir con Sanremo todavía. Hoy cualquier
   usuario autenticado puede escribir en cualquier colección.
4. **CFDI/facturación fiscal** — fuera del MVP a propósito. Solo registrar
   monto y referencia a la OF; integración a un PAC (Facturama, SW Sapien)
   es fase futura.
5. **Deploy**: reglas de Firestore ya publicadas manualmente desde la
   consola; falta hacer `firebase deploy --only hosting` (o similar) para
   tener una URL real que el equipo de Sanremo pueda usar, hoy solo
   corre en `localhost`.

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
