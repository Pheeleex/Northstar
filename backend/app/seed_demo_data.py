"""Seed the NorthStar demo workspace with its initial inventory records."""

from app.db.session import SessionLocal
from app.demo_seeders import seed_inventory_records, seed_workspace_records


def seed_demo_data() -> None:
    with SessionLocal.begin() as session:
        memberships, warehouses = seed_workspace_records(session)
        seed_inventory_records(session, memberships, warehouses)

    print("Seeded NorthStar Foods demo inventory (existing records left unchanged).")


if __name__ == "__main__":
    seed_demo_data()
