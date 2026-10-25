"""Stable demo identifiers and initial NorthStar sample records."""

from uuid import NAMESPACE_URL, UUID, uuid5

from app.core.demo_workspace import DEMO_WORKSPACE_ID

WORKSPACE_ID = DEMO_WORKSPACE_ID


def stable_id(key: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"northstar-demo:{key}")


DEMO_USERS = [
    ("grace-okafor", "Grace Okafor", "OPERATIONS_MANAGER", None),
    ("tunde-bello", "Tunde Bello", "PROCUREMENT_OFFICER", None),
    ("amaka-nwosu", "Amaka Nwosu", "WAREHOUSE_LEAD", "LAG-MAIN"),
    ("chidi-okoye", "Chidi Okoye", "WAREHOUSE_LEAD", "IKE-01"),
    ("muna-bello", "Muna Bello", "WAREHOUSE_LEAD", "IKE-02"),
    ("david-mensah", "David Mensah", "QUALITY_MANAGER", None),
    ("sarah-adeyemi", "Sarah Adeyemi", "FINANCE_APPROVER", None),
    ("michael-cole", "Michael Cole", "MANAGING_DIRECTOR", None),
    ("inventory-admin", "Inventory Admin", "INVENTORY_ADMIN", None),
]

DEMO_WAREHOUSES = [
    ("LAG-MAIN", "Lagos Main Warehouse"),
    ("IKE-01", "Ikeja Warehouse 1"),
    ("IKE-02", "Ikeja Warehouse 2"),
]

DEMO_ITEMS = [
    ("RM-001", "Refined Sunflower Oil", "Raw material", "L", "LAG-MAIN", 1240, 500, False),
    ("RM-004", "Cocoa Powder", "Raw material", "kg", "LAG-MAIN", 185, 250, False),
    ("PK-012", "500ml PET Bottle", "Packaging", "pcs", "IKE-01", 8200, 3000, False),
    ("RM-009", "Whole Milk Powder", "Raw material", "kg", "LAG-MAIN", 0, 120, True),
    ("FG-021", "Cocoa Oat Drink 12-pack", "Finished goods", "ctn", "IKE-02", 460, 200, False),
    ("PK-008", "Printed Carton — 12 pack", "Packaging", "pcs", "IKE-01", 1480, 1800, False),
]

# id, SKU, warehouse code, movement type, reason, signed quantity, balance,
# reference, demo user key, timestamp
DEMO_MOVEMENTS = [
    ("MOV-001", "RM-001", "LAG-MAIN", "IN", "OPENING_STOCK", 1300, 1300, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:00:00+01:00"),
    ("MOV-002", "RM-001", "LAG-MAIN", "OUT", "PRODUCTION_USE", -60, 1240, "ISS-2026-0318", "amaka-nwosu", "2026-10-03T09:15:00+01:00"),
    ("MOV-003", "RM-004", "LAG-MAIN", "IN", "OPENING_STOCK", 225, 225, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:05:00+01:00"),
    ("MOV-004", "RM-004", "LAG-MAIN", "IN", "SUPPLIER_RECEIPT", 18, 243, "PO-2026-0132", "amaka-nwosu", "2026-10-02T11:20:00+01:00"),
    ("MOV-005", "RM-004", "LAG-MAIN", "OUT", "PRODUCTION_USE", -58, 185, "ISS-2026-0321", "amaka-nwosu", "2026-10-03T13:40:00+01:00"),
    ("MOV-006", "PK-012", "IKE-01", "IN", "OPENING_STOCK", 7000, 7000, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:10:00+01:00"),
    ("MOV-007", "PK-012", "IKE-01", "IN", "SUPPLIER_RECEIPT", 1500, 8500, "PO-2026-0135", "chidi-okoye", "2026-10-02T14:10:00+01:00"),
    ("MOV-008", "PK-012", "IKE-01", "OUT", "PRODUCTION_USE", -300, 8200, "ISS-2026-0320", "chidi-okoye", "2026-10-03T15:25:00+01:00"),
    ("MOV-009", "RM-009", "LAG-MAIN", "IN", "OPENING_STOCK", 80, 80, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:15:00+01:00"),
    ("MOV-010", "RM-009", "LAG-MAIN", "OUT", "PRODUCTION_USE", -80, 0, "ISS-2026-0316", "amaka-nwosu", "2026-10-02T16:05:00+01:00"),
    ("MOV-011", "FG-021", "IKE-02", "IN", "OPENING_STOCK", 500, 500, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:20:00+01:00"),
    ("MOV-012", "FG-021", "IKE-02", "OUT", "CUSTOMER_DISPATCH", -40, 460, "DSP-2026-0207", "muna-bello", "2026-10-03T10:50:00+01:00"),
    ("MOV-013", "PK-008", "IKE-01", "IN", "OPENING_STOCK", 2000, 2000, "OPEN-2026-10", "inventory-admin", "2026-10-01T08:25:00+01:00"),
    ("MOV-014", "PK-008", "IKE-01", "OUT", "PRODUCTION_USE", -520, 1480, "ISS-2026-0319", "chidi-okoye", "2026-10-03T12:30:00+01:00"),
]

