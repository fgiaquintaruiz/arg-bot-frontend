## [1.8.165] - 2026-04-11
### Added
- **Calculadora bidireccional:** Ahora podés escribir en ARS y ver el EUR necesario, o escribir en EUR y ver el ARS resultante.
- **Botón de transferencia SEPA:** Datos completos del IBAN de Binance con copiado rápido y botón para abrir la app del banco (Santander, BBVA, etc.).
- **Panel de Configuración (⚙️):** Sincronización con Google Drive, fee de servicio configurable (€0.10–€1.00), lista de exentos y soporte.
- **Badges de confianza:** Nueva sección "¿Por qué confiar en ARGBOT?" con encriptación, open source, soporte y permisos.
- **Banner de actualización automática:** Detecta nuevas versiones y muestra un banner para recargar.
- **Historial con ahorro real:** Ahora calcula y muestra el ahorro vs Remitly por operación y el total acumulado.

### Fixed
- **Address Book en móvil:** Botones de selección, edición y eliminación ahora funcionan con touch handlers correctos.
- **Scroll en móvil:** Calculator y Withdraw ahora tienen scroll cuando el contenido excede la pantalla.
- **Network warning contextual:** El aviso de red BSC ahora solo aparece cuando no hay dirección seleccionada.
- **Duplicate function en AddressBook:** Eliminado `handleAddAddress` duplicado que rompía el build.

### Changed
- **Withdraw reordenado:** Dirección primero → advertencia de red (condicional) → monto → confirmar.
- **Roadmap traducido al español LATAM:** Con renderizado de markdown apropiado.
- **BuenBit → Nexo:** Todas las referencias actualizadas (BuenBit migró a Nexo).
- **Eliminado toggle USD:** Calculadora enfocada exclusivamente en EUR por ahora.
- **PWA optimizada:** Meta tags, overscroll prevention, touch targets mínimos de 44px.

## [1.8.164] - 2026-04-11
### Added
- `version.json` para detección confiable de actualizaciones en PWA.

### Fixed
- **Address Book mobile:** Direcciones seleccionables ahora usan `<button>` con `onTouchEnd`.
- **Edit/Delete siempre visibles:** Botones de edición y eliminación ya no se ocultan en modo selección.

## [1.8.163] - 2026-04-11
### Fixed
- **Self keep-alive:** Backend ahora hace ping a su propia URL pública cada 9 minutos para evitar que Render se duerma.
- **Dashboard refetch:** Se eliminó el re-fetch de datos al cambiar de vista (solo al montar o cambiar usuario).

## [1.8.162] - 2026-04-01
### Changed
- Re-prioritized Roadmap: Moved public analytics (savings vs Remitly, successful trades) and live anonymized operations feed to high priority.

### Fixed
- Fixed Google Login button by correctly passing the `onLogin` prop in `App.tsx`.
- 
## [1.8.161] - 2026-03-20
### Changed
- Updated Roadmap to prioritize public analytics (successful trades, users, savings comparisons) and an anonymized live operations feed for social proof.
## [1.8.160] - 2026-03-20
### Refactored
- Extracted hardcoded legal texts into separate constant files (`terms.ts` and `privacy.ts`) to keep the `LegalModal` component clean and maintainable.
- 
## [1.8.159] - 2026-03-20
### Added
- Added full Privacy Policy documentation to `LegalModal.tsx`.
- 
## [1.8.158] - 2026-03-20
### Added
- Integrated comprehensive Terms and Conditions modal (`LegalModal.tsx`).
### Changed
- Replaced the term "Remesas" with "Transferencias internacionales".
- Updated platform references to explicitly state "Buenbit by Nexo".
- 
## [1.8.157] - 2026-03-20
### Changed
- Added Updates modal to view roadmap and changelogs from inside and outside the app.
- 
## [1.8.156] - 2026-03-20
### Changed
- Redesigned `LandingDocs.tsx` with a friendlier UI (cards, better spacing, softer colors).
- Rewrote copy using local Argentine dialect ("voseo") and simplified terms to make legal and technical constraints more approachable and user-friendly.
- 
## [1.8.155] - 2026-03-20
### Refactored
- Extracted legal disclaimers and documentation from `Login.tsx` into a new `LandingDocs.tsx` component to improve maintainability.
- 
## [1.8.153] - 2026-03-20
### Changed
- Migrated `authService.js` to `authService.ts` to enforce strict typing and maintain consistency across the React codebase.
- 
## [1.8.152] - 2026-03-20
### Added
- Added a robot emoji favicon in `index.html`.
- Updated `BinanceConfig.tsx` to fetch and display the backend's public IP address for easier Binance API whitelisting.
- 
## [1.8.151] - 2026-03-19
### Fixed
- Updated relative import paths for `package.json` in `App.tsx` and `Dashboard.tsx` to reflect the newly flattened `src/` directory structure, resolving Vite build errors.
## [1.8.150] - 2026-03-19
### Fixed
- Purged corrupted `node_modules` and reinstalled dependencies to resolve missing packages (e.g., rollup) caused by workspace separation.

## [1.8.150] - 2026-03-19
### Fixed
- Purged corrupted `node_modules` and reinstalled dependencies to resolve missing packages (e.g., rollup) caused by workspace separation.

## [1.8.149] - 2026-03-19
### Changed
- Flattened the `src/` directory structure by removing the redundant `client/` subfolder left over from the monorepo architecture.
- Updated entry point path in `index.html` to point directly to `/src/main.jsx`.
- 
## [1.8.148] - 2026-03-19
### Added
- **Repository Split:** This repository is now exclusively the Frontend client (`arg-bot-frontend`). All backend Node.js code has been removed. Future version bumps in this repository will only reflect UI, client logic, and frontend configuration changes.