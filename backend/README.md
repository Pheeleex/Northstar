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
5. Run `uv run alembic upgrade head` after the first schema migration has been added.

The local database is named `northstar`. The Compose volume persists data across container restarts; `docker compose down -v` deletes that local data.
