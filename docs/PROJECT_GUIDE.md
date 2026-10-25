# NorthStar Project Guide

**Updated:** 19 October 2026  
**Purpose:** One place to understand what NorthStar is, how the current system fits together, what is implemented, and what we plan to build next.

## Product direction

NorthStar is an operations workspace for a company that manages inventory across multiple warehouses and coordinates procurement, finance, warehouse, production, quality, and dispatch work. It should be dependable and understandable first. We are building complete business workflows and clear records rather than adding infrastructure or features before they are needed.

The current product is a demo. A person can switch between simulated users to see different role experiences. These personas help demonstrate the workflows; they are not authentication and must not be treated as a security boundary.

## System shape today

The project is a small frontend and API application backed by PostgreSQL:

| Part | Current choice | Responsibility |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript | Dashboard, inventory screens, simulated-user switcher, and calls to the API |
| Backend | FastAPI, Python | Versioned HTTP API and inventory business rules |
| Database | PostgreSQL | Workspace, people and roles, warehouses, products, stock, movement history, and adjustment records |
| Database access | SQLAlchemy 2 | Models and database queries/transactions |
| Schema changes | Alembic | Ordered database migrations |
| Local database runtime | Docker Compose | Runs PostgreSQL for local development; the API and frontend can run directly on the computer |

We use a feature-based layout. Inventory owns its backend router, schemas, models, and service; the frontend keeps inventory API calls, components, and types in its inventory feature. Shared app infrastructure lives outside the feature folders. New abstractions should be introduced when a real feature needs them.

### Main folders

```text
backend/
  app/api/v1/                 API router composition and infrastructure endpoints
  app/core/                   Shared application settings and demo workspace
  app/db/                     Database session and model base
  app/features/inventory/     Inventory API, schemas, models, and business rules
  alembic/                    Database migration history

frontend/
  app/                        Next.js routes and shared layout
  features/                   Dashboard, inventory, and other business areas
  shared/                     Reusable UI and demo application state

docs/
  PROJECT_GUIDE.md            Product, architecture, current status, and roadmap
```

## Current database model

The inventory model separates a product from the quantity held at a location. The same workspace SKU identifies the same product in every warehouse; each warehouse has its own balance.

| Table | What it represents | Relationship |
| --- | --- | --- |
| `workspaces` | A company/workspace boundary | Owns memberships, warehouses, products, and inventory records |
| `users` | A person record | Can have memberships in workspaces |
| `workspace_memberships` | A person's role and status in a workspace | Connects a user to a workspace; role is stored on the membership |
| `warehouse_assignments` | A Warehouse Lead's assigned locations | Links a membership to one or more warehouses |
| `warehouses` | A physical stock location | Belongs to one workspace |
| `products` | A product definition with a workspace-unique SKU | Belongs to one workspace and can be stocked in many warehouses |
| `warehouse_stock` | Current balance and reorder level for one product at one warehouse | Unique by warehouse and product; stores the location-specific on-hand quantity |
| `inventory_movements` | The stock-change ledger | Records quantity delta, resulting balance, reason, reference, time, and recorder |
| `inventory_adjustments` | A requested stock correction awaiting review | Refers to a warehouse/product and records requester, reviewer, reason, notes, and status |

The database uses workspace-scoped foreign keys to keep records from crossing company boundaries. Stock quantities use three decimal places. Current code uses a fixed demo workspace until proper workspace selection and authentication are built.

## Inventory workflows implemented

### Product and warehouse setup

- Inventory Admin can add a warehouse.
- Inventory Admin can add a product to a warehouse.
- A product SKU is shared across warehouses. Adding the same SKU to another warehouse creates another location stock row for the same product, with the same product details.
- New warehouse stock starts at zero. Product setup does not silently create a stock movement.
- Inventory Admin can see location-level balances and the combined company balance for each SKU.
- Warehouse Leads are scoped to their assigned warehouse in the demo UI and API actions.

### Opening stock

Opening stock initializes a location's balance when NorthStar first begins tracking that product at that warehouse. It is a one-time initial process, not an adjustment.

1. Inventory Admin creates the item and chooses its warehouse. They can leave the optional opening quantity blank or enter a positive quantity.
2. With a positive quantity, the backend creates the product/location stock and `IN / OPENING_STOCK` movement in the same database transaction. A blank or zero quantity creates an empty stock record with no movement.
3. If the quantity was left blank, Inventory Admin can use **Set opening stock** later for that untouched product/location. The backend locks the stock row and checks that it still has a zero balance and no prior movement before setting the balance and writing the ledger entry.
4. After opening stock is set, the product/location is no longer eligible. Movement history shows the quantity, resulting balance, reference, timestamp, and recorder.

The API and database both protect the one-time rule. The API rejects non-admin users and attempts to initialize a location that already has stock activity. Migration `0003_opening_stock_unique` adds a database uniqueness guard for one opening-stock ledger row per product and warehouse.

### Adjustments

- A Warehouse Lead submits an increase or decrease request with a predefined reason and a required explanation.
- Warehouse Leads can request changes only for their assigned warehouse.
- The request remains pending and does not change stock.
- Inventory Admin approves or returns the request. Approval updates the balance and records an adjustment movement; a returned or pending request does not change stock.

### Movement history

Movement history is a ledger view. There is no generic form or API for manually recording a movement. A movement is written by the transaction that caused the stock change.

The fixed movement types are `IN`, `OUT`, and `ADJUSTMENT`. A reason code explains the business event. The ledger shows item, warehouse, quantity change, balance after, reference, recorder, and timestamp. It has no free-text movement description.

Opening stock and approved adjustments currently create movements through implemented workflows. Receipt, return, transfer, dispatch, and production movement rows are part of the planned workflows below; those events should be generated by their source documents, never typed into the ledger directly.

## Current API surface

The inventory API is mounted below `/api/v1`:

| Endpoint | Purpose |
| --- | --- |
| `GET /inventory/bootstrap` | Loads warehouses, item balances, movements, and adjustments for the demo UI |
| `POST /inventory/warehouses` | Adds a warehouse as Inventory Admin |
| `POST /inventory/items` | Adds a product/location stock record; a positive optional `opening_stock` also writes its initial ledger entry |
| `POST /inventory/opening-stock` | Sets the one-time initial balance and writes its ledger entry |
| `POST /inventory/adjustments` | Submits an adjustment request |
| `POST /inventory/adjustments/{reference_code}/review` | Approves or returns an adjustment |

The frontend reads and mutates inventory through its feature API client. It stores only the selected demo persona in browser local storage; inventory records come from PostgreSQL through the backend.

## Completed so far

- Re-established the frontend-first application shell and feature-oriented frontend structure.
- Added a Python/FastAPI backend with a feature-oriented layout and PostgreSQL, SQLAlchemy, and Alembic foundations.
- Added inventory tables and migration history for workspaces, memberships, warehouses, products, location stock, movements, and adjustments.
- Added an additive demo seed for the workspace, simulated users, three warehouses, products, balances, movement history, and a pending adjustment.
- Connected inventory loading and mutations to the backend rather than using the frontend mock inventory store.
- Built the inventory register, stock-movement view, warehouse view, warehouse creation, and adjustment review experience.
- Added one-time opening stock as a separate Inventory Admin workflow.
- Applied migration `0003_opening_stock_unique` to the local development database; hosted databases still need the migration applied when they are introduced.
- Kept login/authentication out of the demo for now; simulated users are used to explore the role-specific experience.

## Planned path

The sequence below is a direction, not a claim that these workflows are already available.

### 1. Finish and stabilize the inventory foundation

- Apply pending Alembic migrations to each new or hosted database before using this version.
- Keep the stock ledger append-oriented and ensure source records and movement writes commit atomically.
- Add a real movement source relationship as each source workflow is implemented.
- Review inventory edge cases and role scoping as the UI and API grow.

### 2. Procurement and receiving

- Define suppliers, procurement requests, approval thresholds, purchase orders, and receipt records.
- Let a Procurement Officer prepare the purchase request and route higher-value requests to the Finance Approver.
- Post supplier-receipt `IN` movements only when goods are received against an approved procurement record.
- Keep requested, approved, ordered, partially received, and completed stages visible to the people responsible.

### 3. Transfers between warehouses

- Create a transfer record with source, destination, product lines, quantities, and status.
- Commit the source `OUT` and destination `IN` entries as one transfer transaction, with one transfer reference.
- Preserve warehouse-level stock while allowing Inventory Admin to review company-wide totals.

### 4. Production

- Define production runs and the material/product lines they consume or produce.
- Record material consumption as `OUT` and finished-goods receipts as `IN` from the production workflow.
- Link every resulting movement to its production run and warehouse.

### 5. Dispatch, customer returns, and quality

- Add the business records needed for dispatch to a customer or supplier; dispatch creates `OUT` movements.
- Add customer-return intake and checks; accepted returns create `IN` movements.
- Add quality inspection and stock-hold/release decisions where they fit these workflows.

### 6. Authentication and real authorization

- Replace `actor_id` demo identity with authenticated users and server-derived workspace membership.
- Enforce permissions on the server for every operation, including warehouse assignments and approval roles.
- Keep the persona switcher only as a clearly labeled demo facility if it remains useful.
- Complete this before inviting external users to rely on the application with real company data.

### 7. Deployment and operational readiness

- Keep frontend, API, database, and environment-specific CORS configuration aligned across local and hosted environments.
- Use managed PostgreSQL for hosted environments, apply migrations as part of release operations, and seed only demo environments.
- Add backups, useful logs, health checks, and monitoring as the application approaches real use.
- Review data retention, security, and recovery needs before production use.

## Local setup and environment

The detailed setup steps live in [backend/README.md](../backend/README.md) and [frontend/README.md](../frontend/README.md). In brief:

1. Copy each `.env.example` to the local environment file and fill in local values.
2. Start the PostgreSQL service with Docker Compose from `backend/`.
3. Install/sync the backend and frontend dependencies.
4. Apply Alembic migrations and run the additive demo seed.
5. Start the FastAPI backend and Next.js frontend in separate terminals.

The database volume persists across normal container restarts. Removing the Compose volume deletes the local database. Never commit `.env` files or place private CORS configuration in public source files; the checked-in examples should contain placeholders only.

## Current limitations

- The demo is centered on one hard-coded workspace.
- Simulated persona selection is not authentication. The API currently accepts demo actor identifiers and must not be exposed as a secure multi-user system.
- Procurement, supplier receipt, transfer, production, dispatch, customer return, and full quality workflows are not implemented yet.
- Demo movement rows are seeded history and do not mean that users can manually create those event types.
- Deployment configuration and operational safeguards must be reviewed for the actual hosting environment before production use.
