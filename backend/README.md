# NorthStar backend

The backend uses a feature-based structure:

- `app/features/<feature>/` owns a business area's API router, request/response schemas, database models, and business rules. Inventory starts with `router.py`, `schemas.py`, `models.py`, and `service.py`.
- `app/api/v1/router.py` composes feature routers under the versioned API prefix. It should not contain business rules.
- `app/core/` and `app/db/` hold cross-feature application and database infrastructure.
- Health and readiness endpoints are API infrastructure and live under `app/api/v1/`.

Keep feature code together. Add repository abstractions or deeper folders only when a feature's actual complexity calls for them.

## Local development

The backend uses PostgreSQL, SQLAlchemy 2, Psycopg 3, and Alembic. Run PostgreSQL locally with Docker Compose.

1. Install `uv` and Docker Desktop.
2. From this directory, copy `.env.example` to `.env`.
3. Run `uv sync` to create the Python environment and lock the dependencies.
4. Run `docker compose up -d db` to start the local database.
5. Run `uv run alembic upgrade head` to create or update the inventory tables.
6. Run `uv run python -m app.seed_demo_data` to load the demo workspace, simulated users, warehouses, stock, movement history, and pending adjustment. The seed is additive and safe to rerun; it does not overwrite existing records.

Start the API from this directory with `uv run fastapi dev`. The frontend uses `http://localhost:8000/api/v1` by default; set `NEXT_PUBLIC_API_BASE_URL` in the frontend environment when the API is hosted elsewhere.

The local database is named `northstar`. The Compose volume persists data across container restarts; `docker compose down -v` deletes that local data.

Set `CORS_ORIGINS` in `backend/.env` to a JSON array containing the frontend origins that should be able to call the API. The checked-in `.env.example` leaves this list empty; local and deployed origins belong in each environment's own `.env` or environment settings.
