# NorthStar frontend

The frontend is a Next.js App Router application for the NorthStar operations workspace. It currently contains the dashboard and inventory register, with the remaining module routes ready to build out.

## Demo data

- Inventory data loads from the backend through `features/inventory/api/`. The frontend keeps only the selected simulated user in `localStorage`.
- `features/workspace/data/` provides the simulated users for the persona switcher. Procurement, warehouse, quality, and dashboard sample records remain in their own feature `data/` folders.
- Run `uv run python -m app.seed_demo_data` from `backend/` after applying migrations to populate the demo workspace. The seed is additive and safe to rerun.
- Inventory Admin can add warehouses and items. Warehouse Leads can submit reasoned adjustment requests. Inventory Admin review posts approved adjustments to the movement ledger; pending and returned requests do not change stock.
- Movement types are fixed as `IN`, `OUT`, and `ADJUSTMENT`; a predefined reason records why stock changed. There is no free-text movement description.
- Products are workspace scoped and stock balances are warehouse scoped, so the same SKU can be viewed at each location and aggregated across warehouses.
- The Inventory page provides item, movement, and warehouse views. Warehouse Leads see their assigned warehouse; Inventory Admin sees all workspace locations.

Simulated personas are for the demo experience and are not authentication. The API will need real authorization before external users rely on it.

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
