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
- **Adjuntos, cancelación, auditoría, export y más**:
  - Adjuntos genéricos vía Firebase Storage (`components/Adjuntos.jsx`,
    recibe `coleccion`+`docId`), usados en cotizaciones (Ventas) y
    órdenes de compra (Compras, para facturas) — `storage.rules` cubre
    ambas rutas, falta publicarlas (ver Pendiente).
  - Historial de movimientos por material en Almacén
    (`HistorialMaterialModal`, ícono de reloj por fila).
  - "Generar O.C. sugerida" desde un material bajo mínimo (precarga el
    modal de nueva O.C. con `lineaInicial`).
  - Alertas de "Vencida" en O.C. y OF cuyo plazo de proveedor ya pasó
    (`lib/plazos.js`).
  - Avatar real de Google en el topbar.
  - Cancelar cotización (nuevo estado "Cancelado", con confirmación).
  - Auditoría (`/auditoria`, visible en el detalle de cada cotización):
    creación, edición, cancelación, OF abierta, entrada a producción,
    completada/facturada — con usuario y fecha.
  - Exportar cotizaciones a CSV desde Ventas.
  - Buscadores en Compras (proveedor), Producción (cliente) y Almacén
    (material).
  - `ProveedoresPanel` dentro de Compras: lista de proveedores con
    nombre editable inline.
  - Dashboard de inicio (ruta `/`, primer ítem del sidebar): KPIs
    combinados de los 4 módulos + feed de actividad reciente.
- **Robustez**: persistencia offline de Firestore (sigue funcionando si
  se cae el wifi en planta, sincroniza sola al reconectar) + indicador
  "Sin conexión" en el topbar. Toda escritura a Firestore/Storage que
  antes fallaba en silencio ahora muestra un toast de error. Validación
  de stock (una salida no puede dejar stock negativo). Sidebar
  responsive tipo cajón con hamburguesa para celular/tablet. Botón
  "Imprimir" en cotizaciones (estilos `.no-print`/`@media print`).
  "Duplicar cotización" para clientes recurrentes. Confirmación antes de
  borrar un adjunto. Página 404 para rutas inexistentes.
- **Cierre de funciones** (última tanda antes de probar todo junto):
  notificaciones clickeables con link a la cotización/módulo relacionado
  (antes el campo `link` no se usaba), alerta de entrega vencida en
  Ventas, exportar CSV en Compras/Producción/Almacén (antes solo en
  Ventas), eliminar material/proveedor con confirmación, notas internas
  por cotización (`/notas`, separado de documentos adjuntos).
- **Finanzas** (`/finanzas`, nuevo módulo — surgió de un problema real
  que describió el administrativo: cobran a 60-90 días con Fudeco pero
  pagan a proveedores antes, hoy hacen la cuenta mentalmente). Cuentas
  por cobrar (cotizaciones Facturado + Fudeco, vencimiento = fecha
  facturado + `diasCredito` propio de cada cotización) y por pagar
  (O.C. recibidas con `montoTotal`, vencimiento = fecha recibida +
  `plazoPagoDias` propio de cada proveedor). Botones "Cobrado"/"Pagado",
  badges de vencida, y saldo proyectado a 30 días. Requirió campos
  nuevos: `diasCredito`/`fechaFacturado`/`cobrado` en cotización,
  `plazoPagoDias` en proveedor (editable, `ProveedoresPanel` ahora es
  tabla), `montoTotal`/`fechaRecibida`/`pagado` en O.C.
- **Pulido visual + robustez de UX**: componentes compartidos nuevos
  (`Button` con spinner de carga, `IconButton`, `SearchInput`, `Modal`
  con botón de cerrar/Escape/blur). Órdenes de compra ya recibidas:
  proveedor/plazo/monto siguen editables, materiales quedan bloqueados
  (de lectura) para no descuadrar el stock — con botón "Revertir" que
  regresa la O.C. a pendiente restando el stock y borrando los
  movimientos generados (`stockActions.revertirRecepcion`).
- **Patrón de deshacer**: `ToastContext` soporta
  `toast(mensaje, tipo, { onUndo })` — botón "Deshacer" ~10s en: marcar
  recibida una O.C., movimiento manual de almacén, cancelar cotización,
  cobrado/pagado en Finanzas, iniciar producción/completar y facturar.
- **Revisión de seguridad completa**:
  - Corregido: inyección de fórmulas CSV (`exportCsv.js` neutraliza
    celdas que empiezan con `= + - @`), límite de 20 MB por adjunto
    (cliente + `storage.rules`), headers de seguridad en Hosting
    (X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
    Permissions-Policy).
  - **Hallazgo crítico corregido**: `firestore.rules`/`storage.rules`
    solo exigían "¿inició sesión?" — cualquier persona con cuenta de
    Google tenía acceso completo. Ahora exigen pertenecer a
    `/usuariosAutorizados` (doc id = email). Ya están autorizados
    `schottalfredo@gmail.com` y `sistemasanremo@gmail.com`. Agregar más
    gente: `node scripts/agregarUsuario.mjs correo@ejemplo.com`
    (requiere `scripts/serviceAccountKey.json`). `SinAccesoPage.jsx`
    muestra un mensaje claro si alguien inicia sesión pero no está en
    la lista, en vez de que la app se vea rota.
  - Verificado limpio: sin `dangerouslySetInnerHTML`/`eval`, sin
    secretos en git (ni en el historial), `npm audit --omit=dev` sin
    vulnerabilidades (las moderadas restantes son de firebase-tools/
    firebase-admin, herramientas de desarrollo, no se empacan al
    cliente).
- Repo git local inicializado con commits por feature.

**Nota para la próxima sesión**: el sistema ya cubre el flujo completo
de negocio + bastantes extras, y ya pasó una revisión de seguridad.
Antes de seguir agregando funciones, lo que más aporta ahora es que
alguien de Sanremo lo pruebe de verdad — ahí van a salir los
pendientes reales.

## Pendiente / próximos pasos

1. **Publicar firestore.rules actualizado** (urgente): el archivo local
   ya tiene la restricción a `/usuariosAutorizados`, pero falta pegarlo
   en Firebase Console → Firestore → Reglas (igual que las veces
   anteriores) para que tome efecto — mientras no se publique, sigue
   abierto a cualquier cuenta de Google. `storage.rules` también está
   actualizado localmente pero Storage sigue sin activarse (ver
   Decisiones).
2. **Finanzas — alcance a propósito recortado**: "por cobrar" solo
   cubre crédito Fudeco. El resto del anticipo (cuando la condición es
   "anticipo") no se rastrea como cuenta por cobrar porque no hay una
   regla de negocio clara sobre cuándo se cobra ese resto — preguntar a
   Sanremo si vale la pena. `montoTotal` en O.C. es opcional y manual
   (no hay catálogo de precios de materiales), así que una O.C. sin ese
   campo no aparece en "por pagar" aunque exista. Sin recordatorios
   automáticos ni Cloud Functions — es una pantalla de visibilidad, el
   admin sigue marcando manualmente cobrado/pagado.
1. **Publicar storage.rules**: igual que se hizo con firestore.rules,
   falta pegar el contenido de `storage.rules` en Firebase Console →
   Storage → Reglas (o `firebase deploy --only storage` con el CLI) para
   que la función de adjuntos funcione de verdad.
2. **Cloud Functions** (automatizaciones del lado servidor): hoy la
   suma/resta de stock corre client-side vía `runTransaction`, lo cual
   funciona pero no es a prueba de un cliente malicioso o con Firestore
   rules más laxas. Migrar a Cloud Functions da más control (ej. trigger
   al marcar O.C. recibida, resta automática al consumir BOM en
   Producción, sugerencia de O.C. cuando stock < mínimo).
3. **Consumo de BOM en Producción**: hoy Producción no resta stock del
   material — falta enlazar el catálogo de materiales de este sistema
   con el proyecto de tornillería/BOM que Yamil está armando por
   separado (ver contexto del proyecto), y que Producción reste stock al
   avanzar.
4. **Roles por área** — sin definir con Sanremo todavía, dejado fuera a
   propósito (ver Decisiones). Hoy cualquier usuario autenticado puede
   escribir en cualquier colección.
5. **CFDI/facturación fiscal** — fuera del MVP a propósito. Solo registrar
   monto y referencia a la OF; integración a un PAC (Facturama, SW Sapien)
   es fase futura.
6. **Deploy**: reglas de Firestore ya publicadas manualmente desde la
   consola; falta hacer `firebase deploy --only hosting` (o similar) para
   tener una URL real que el equipo de Sanremo pueda usar, hoy solo
   corre en `localhost`.

## Decisiones tomadas en esta fase

- Roles por usuario: pedido explícitamente por el usuario junto con
  varias otras cosas ("todo"), pero se dejó fuera a propósito porque el
  documento original dice "sin definir aún, no asumir, preguntar" sobre
  permisos por área. Retomar cuando Sanremo defina quién puede escribir
  en qué módulo.

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
