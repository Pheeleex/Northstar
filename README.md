# NorthStar

NorthStar is an operations workspace for a multi-warehouse business. The current demo focuses on inventory and uses simulated employee personas while the backend and workflows are built out.

Start with the [Project Guide](docs/PROJECT_GUIDE.md) for the system overview, data model, completed work, and roadmap. For local setup, see the [backend guide](backend/README.md) and [frontend guide](frontend/README.md).

## Current local development

- Start PostgreSQL with Docker Compose from `backend/`.
- Run the FastAPI backend from `backend/`.
- Run the Next.js frontend from `frontend/`.
- Apply Alembic migrations and load the demo workspace before using inventory.

See the backend README for exact setup commands and environment variables. Local `.env` files are intentionally excluded from version control.
