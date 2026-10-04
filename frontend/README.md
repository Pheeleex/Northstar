# NorthStar frontend

The frontend is a Next.js App Router application for the NorthStar operations workspace. It currently contains the dashboard and inventory register, with the remaining module routes ready to build out.

## Demo store

The demo uses a small client-side store in `shared/stores/DemoStoreProvider.tsx`:

- `features/inventory/data/` and `features/inventory/types/` own inventory seeds and domain types.
- `features/workspace/data/` provides the demo employees used by the user switcher.
- Procurement, warehouse, quality, and dashboard demo records live in their respective feature `data/` folders.
- `DemoStoreProvider` loads a saved state from browser `localStorage` after the page hydrates, or starts from the seed data when no saved state exists.
- The stored state includes a schema version, configured warehouses, the active demo employee, inventory items, adjustment requests, and the stock movement ledger.
- The browser key is `northstar.demo-store.v1`; its current schema version is 5. Older saved states migrate forward, preserving the active user and inventory, renaming legacy warehouse references, converting older movement labels to fixed types and reasons, and reconciling balances into the movement ledger. Unknown versions start from current seed data.
- `useDemoStore()` is the shared source for warehouse options, inventory, adjustment review, and movements. Inventory Admin can add warehouses; new locations are immediately available to item records and persist in the demo store. Movement types are fixed as `IN`, `OUT`, and `ADJUSTMENT`; a separate predefined reason records why stock changed. There is no free-text movement description.
- Adding an item records an `IN / Opening stock` movement. Inventory Admin approval updates the balance and writes an `ADJUSTMENT` movement; pending and returned requests do not affect stock. Seeded movement history reconciles to each hardcoded item's on-hand quantity.
- Stock records are unique by SKU and warehouse, so the same product can be stocked at more than one location. Product name, category, and unit stay consistent for a SKU, while warehouse balances and reorder levels remain separate. Inventory Admin sees each warehouse balance and an across-warehouse total.
- The Inventory page provides item, movement, and warehouse views, with Warehouse Leads scoped to their assigned warehouse.

The demo store is local to one browser profile. It does not synchronize between users or devices and is not an authorization mechanism. The API must enforce real permissions when backend integration begins. The provider is the seam for replacing local demo state with API-backed data while keeping the screens and their domain types.

## Feature layout

- `app/` contains Next.js routes and layouts; route pages stay thin and render feature pages or components.
- `features/` contains business-area pages, components, data, and types. Add `api/`, `hooks/`, `schemas/`, or `services/` only when a feature needs them.
- `shared/` contains UI and state used across multiple features.

## Development

```bash
npm install
npm run dev
```

Lint and build:

```bash
npm run lint
npm run build
```
