## [1.8.175] - 2026-04-19
### Cambiado
- **Refactor Settings:** Limpieza de código y simplificación del componente de configuración.

## [1.8.174] - 2026-04-19
### Corregido
- **Historial robusto ante localStorage corrupto:** `History.tsx` ahora envuelve `JSON.parse` en try/catch y defaultea a `[]` si la key está dañada (evita pantalla en blanco).
- **Copy unificado en español en AddressBook:** Mensajes de validación de dirección BSC/BEP20 y checksum ahora en español rioplatense.

## [1.8.173] - 2026-04-19
### Agregado
- **Whitelist de emails autorizados:** Nueva variable de entorno `VITE_WHITELIST_EMAILS` (comma-separated). Usuarios fuera de la lista son deslogueados inmediatamente tras `signInWithPopup` mediante `signOut` awaited + gate de render `(user && !rejected)` para evitar flash del Dashboard.
- **Banners de acceso restringido:** Login y Dashboard muestran banners persistentes informando que el acceso está limitado.

### Seguridad
- **Fail-closed:** Si `VITE_WHITELIST_EMAILS` está vacía o ausente, TODOS los accesos se rechazan.

## [1.8.170] - 2026-04-12
### Corregido
- **Input EUR desbordado:** Tamaño contenido con `maxWidth`, `minWidth: 0`, `boxSizing`.
- **Botones pegados:** Espaciado correcto entre botón "Abrir banco" y "Ver datos".
- **Sin feedback al tocar banco:** Ahora muestra spinner "Abriendo tu banco..." y mensaje inline estilizado si falla (reemplaza el alert nativo feo).
- **IBAN de Binance hardcoded:** Ahora el usuario lo configura en ⚙️ Configuración → pestaña 🏦 Binance.

### Agregado
- **Nueva pestaña 🏦 Binance en Configuración:** IBAN, beneficiario y BIC/SWIFT del depósito EUR de Binance.
- **Explicación de payto::** Mensaje inline explica qué es y qué hace si tu banco no lo soporta.
- **Aviso si IBAN no configurado:** Banner amarillo en calculadora提醒 configurar el IBAN.

## [1.8.169] - 2026-04-12
### Agregado
- **Botón "Abrir app del banco":** Intenta abrir la app bancaria con URI `payto:` pre-rellenando IBAN, monto y concepto. Si no funciona, muestra los datos para copiar.
- **Detección inteligente:** Si la app se abre (la página se oculta), no muestra fallback. Si no se abre en 2.5s, muestra alert con los datos.

## [1.8.168] - 2026-04-12
### Cambiado
- **Calculadora rediseñada:** "Costo Final" ahora es un input editable grande (reemplaza la etiqueta EUR separada).
- **Botón de copiar todos los datos SEPA:** Un solo toque copia IBAN, BIC, monto y concepto.
- **Quitado `payto:` URI:** Reemplazado por copia manual (los bancos móviles no soportan el esquema).

## [1.8.167] - 2026-04-12
### Agregado
- **Sync real con Google Drive:** Subí y bajá tu config (API keys, libreta, historial) desde tu Google Drive. Funciona con OAuth de Google Identity Services.
- **Logs de debug:** Logs en AddressBook, Calculadora y Settings para diagnosticar problemas en móvil.

### Corregido
- **Botones editar/eliminar:** Ahora siempre visibles en la libreta de direcciones, tanto en modo selección como en modo gestión.
- **Botón del banco:** Arreglado con `setTimeout` para evitar que `preventDefault` bloquee la navegación en móvil.
- **Mensaje de sync entre dispositivos:** Ahora explica claramente que el backup es local por defecto.

## [1.8.166] - 2026-04-11
### Corregido
- `update-version.mjs` usa `import` en lugar de `require` para ES modules.

## [1.8.165] - 2026-04-11
### Agregado
- **Calculadora bidireccional:** Ahora podés escribir en ARS y ver el EUR necesario, o escribir en EUR y ver el ARS resultante.
- **Botón de transferencia SEPA:** Datos completos del IBAN de Binance con copiado rápido y botón para abrir la app del banco (Santander, BBVA, etc.).
- **Panel de Configuración (⚙️):** Sincronización con Google Drive, configuración de Binance y soporte.
- **Badges de confianza:** Nueva sección "¿Por qué confiar en ARGBOT?" con encriptación, código abierto, soporte y permisos.
- **Banner de actualización automática:** Detecta nuevas versiones y muestra un banner para recargar.
- **Historial con ahorro real:** Ahora calcula y muestra el ahorro vs Remitly por operación y el total acumulado.

### Corregido
- **Libreta de direcciones en móvil:** Botones de selección, edición y eliminación ahora funcionan con touch handlers correctos.
- **Scroll en móvil:** Calculadora y Retiro ahora tienen scroll cuando el contenido excede la pantalla.
- **Advertencia de red contextual:** El aviso de red BSC ahora solo aparece cuando no hay dirección seleccionada.
- **Función duplicada en AddressBook:** Eliminado `handleAddAddress` duplicado que rompía el build.

### Cambiado
- **Retiro reordenado:** Dirección primero → advertencia de red (condicional) → monto → confirmar.
- **Hoja de ruta traducida al español LATAM:** Con renderizado de markdown apropiado.
- **BuenBit → Nexo:** Todas las referencias actualizadas (BuenBit migró a Nexo).
- **Eliminado toggle USD:** Calculadora enfocada exclusivamente en EUR por ahora.
- **PWA optimizada:** Meta tags, prevención de overscroll, objetivos de toque mínimos de 44px.

## [1.8.164] - 2026-04-11
### Agregado
- `version.json` para detección confiable de actualizaciones en PWA.

### Corregido
- **Libreta de direcciones en móvil:** Direcciones seleccionables ahora usan `<button>` con `onTouchEnd`.
- **Editar/Eliminar siempre visibles:** Botones de edición y eliminación ya no se ocultan en modo selección.

## [1.8.163] - 2026-04-11
### Corregido
- **Auto keep-alive:** Backend ahora hace ping a su propia URL pública cada 9 minutos para evitar que Render se duerma.
- **Re-fetch del Dashboard:** Se eliminó la recarga de datos al cambiar de vista (solo al montar o cambiar usuario).

## [1.8.162] - 2026-04-01
### Cambiado
- Hoja de ruta re-priorizada: Analíticas públicas (ahorro vs Remitly, operaciones exitosas) y feed de operaciones anonimizadas pasaron a alta prioridad.

### Corregido
- Botón de inicio de sesión con Google arreglado pasando correctamente la propiedad `onLogin` en `App.tsx`.

## [1.8.161] - 2026-03-20
### Cambiado
- Hoja de ruta actualizada para priorizar analíticas públicas (operaciones exitosas, usuarios, comparaciones de ahorro) y un feed de operaciones en vivo anonimizado como prueba social.

## [1.8.160] - 2026-03-20
### Refactorizado
- Textos legales extraídos a archivos constantes separados (`terms.ts` y `privacy.ts`) para mantener el componente `LegalModal` limpio y mantenible.

## [1.8.159] - 2026-03-20
### Agregado
- Documentación completa de Política de Privacidad en `LegalModal.tsx`.

## [1.8.158] - 2026-03-20
### Agregado
- Modal integral de Términos y Condiciones (`LegalModal.tsx`).

### Cambiado
- Reemplazado el término "Remesas" con "Transferencias internacionales".
- Referencias a la plataforma actualizadas para mencionar "Buenbit by Nexo".

## [1.8.157] - 2026-03-20
### Cambiado
- Modal de Novedades agregado para ver hoja de ruta y changelogs desde dentro y fuera de la app.

## [1.8.156] - 2026-03-20
### Cambiado
- `LandingDocs.tsx` rediseñado con interfaz más amigable (tarjetas, mejor espaciado, colores más suaves).
- Textos reescritos en dialecto argentino local ("voseo") y términos simplificados para hacer las restricciones legales y técnicas más accesibles.

## [1.8.155] - 2026-03-20
### Refactorizado
- Descargos de responsabilidad legales y documentación extraídos de `Login.tsx` al nuevo componente `LandingDocs.tsx` para mejorar mantenibilidad.

## [1.8.153] - 2026-03-20
### Cambiado
- Migrado `authService.js` a `authService.ts` para forzar tipado estricto y mantener consistencia en el código React.

## [1.8.152] - 2026-03-20
### Agregado
- Favicon con emoji de robot en `index.html`.
- `BinanceConfig.tsx` ahora obtiene y muestra la IP pública del backend para facilitar la lista blanca de API de Binance.

## [1.8.151] - 2026-03-19
### Corregido
- Rutas de importación relativas actualizadas para `package.json` en `App.tsx` y `Dashboard.tsx` reflejando la estructura aplanada de `src/`, resolviendo errores de build de Vite.

## [1.8.150] - 2026-03-19
### Corregido
- `node_modules` corrupto purgado y dependencias reinstaladas para resolver paquetes faltantes (ej. rollup) causados por la separación del workspace.

## [1.8.149] - 2026-03-19
### Cambiado
- Estructura de `src/` aplanada eliminando la subcarpeta `client/` redundante leftover de la arquitectura monorepo.
- Ruta de entrada en `index.html` actualizada para apuntar directamente a `/src/main.jsx`.

## [1.8.148] - 2026-03-19
### Agregado
- **Repositorio dividido:** Este repositorio es ahora exclusivamente el cliente Frontend (`arg-bot-frontend`). Todo el código backend Node.js fue removido. Futuros cambios de versión en este repositorio solo reflejarán cambios en UI, lógica del cliente y configuración frontend.
