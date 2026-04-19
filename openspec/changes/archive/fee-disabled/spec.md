# Spec — fee-disabled

## Scope

Gating behavior for the service-fee feature in `src/components/Settings.tsx`. When `FEE_ENABLED === false` (current state), the Fee tab MUST be unreachable via UI or deep-link, and the default `service_fee` value in localStorage MUST be `"0"`.

## Requirements

- R-FD-1: The module-level constant `FEE_ENABLED` in `src/components/Settings.tsx` MUST default to `false`.
- R-FD-2: When `FEE_ENABLED` is `false`, the `💰 Fee` tab button MUST NOT be rendered.
- R-FD-3: When `FEE_ENABLED` is `false`, the Fee tab panel content MUST NOT be rendered, even if `activeTab === "fee"`.
- R-FD-4: When `FEE_ENABLED` is `false`, if the component is mounted with `initialTab="fee"`, the `activeTab` state MUST initialize to `"sync"`.
- R-FD-5: When `FEE_ENABLED` is `false`, the default value written to `localStorage.service_fee` on first load MUST be `"0"` (not `"0.50"`).
- R-FD-6: Fee-related localStorage keys and existing values MUST be preserved (not deleted) to allow a clean re-enable.

## Scenarios

### SPEC-FD-001 — Fee tab button hidden when disabled

**Given** `FEE_ENABLED === false` in `Settings.tsx`
**When** the Settings component is rendered
**Then** no button with the label `💰 Fee` is present in the DOM
**And** exactly 3 tab buttons are rendered: `🔄 Sync`, `📡 Binance`, `💬 Soporte`

### SPEC-FD-002 — Fee panel content not rendered when disabled

**Given** `FEE_ENABLED === false`
**When** Settings mounts with any `initialTab` value
**Then** the Fee panel DOM (inputs for fee percentage, fee fixed, etc.) is NOT in the document

### SPEC-FD-003 — Deep-link `initialTab="fee"` coerced to `"sync"` when disabled

**Given** `FEE_ENABLED === false`
**When** `<Settings initialTab="fee" />` is rendered
**Then** `activeTab` initializes to `"sync"`
**And** the Sync panel content is visible

### SPEC-FD-004 — Default `service_fee` is `"0"` when disabled

**Given** `FEE_ENABLED === false` and no prior `service_fee` in localStorage
**When** Settings mounts
**Then** `localStorage.getItem("service_fee")` returns `"0"` (not `"0.50"`)

### SPEC-FD-005 — Re-enable path (skipped, future-proof)

**Given** `FEE_ENABLED === true`
**When** Settings is rendered
**Then** the `💰 Fee` tab button is present
**And** `<Settings initialTab="fee" />` initializes `activeTab="fee"`
**And** the Fee panel content is rendered

> Covered by `.skip` tests in `src/tests/Settings.test.jsx` — un-skip when flipping the flag.

## Non-requirements

- NR-FD-1: Server-side fee enforcement (no backend fee logic exists).
- NR-FD-2: Removal of fee code paths (preserved for re-enable).
- NR-FD-3: Environment-variable-driven toggle (source constant is audit-friendlier).
