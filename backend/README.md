# NorthStar backend

The backend uses a feature-based structure:

- `app/features/<feature>/` owns a business area's API router, request/response schemas, database models, and business rules. Add modules such as `router.py`, `schemas.py`, `models.py`, and `service.py` when that feature needs them.
- `app/api/v1/router.py` composes feature routers under the versioned API prefix. It should not contain business rules.
- `app/core/` and `app/db/` hold cross-feature application and database infrastructure.
- Health and readiness endpoints are API infrastructure and live under `app/api/v1/`.

Keep feature code together. Add repository abstractions or deeper folders only when a feature's actual complexity calls for them.
