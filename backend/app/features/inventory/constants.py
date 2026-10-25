"""Inventory reason codes and labels shared by reads and writes."""

MOVEMENT_LABELS = {
    "OPENING_STOCK": "Opening stock",
    "SUPPLIER_RECEIPT": "Supplier receipt",
    "CUSTOMER_RETURN": "Customer return",
    "TRANSFER": "Transfer",
    "PRODUCTION_USE": "Production use",
    "CUSTOMER_DISPATCH": "Customer dispatch",
    "WRITE_OFF": "Write-off",
    "COUNT_VARIANCE": "Count variance",
    "DAMAGE_OR_SPOILAGE": "Damage or spoilage",
    "RECEIVING_CORRECTION": "Receiving correction",
    "EXPIRY": "Expiry",
    "OTHER": "Other",
}
ADJUSTMENT_REASON_CODES = {
    "Count variance": "COUNT_VARIANCE",
    "Damage or spoilage": "DAMAGE_OR_SPOILAGE",
    "Receiving correction": "RECEIVING_CORRECTION",
    "Expiry": "EXPIRY",
    "Other": "OTHER",
}
ADJUSTMENT_REASON_LABELS = {value: key for key, value in ADJUSTMENT_REASON_CODES.items()}
STATUS_LABELS = {
    "PENDING_REVIEW": "Pending review",
    "APPROVED": "Approved",
    "RETURNED": "Returned",
}

