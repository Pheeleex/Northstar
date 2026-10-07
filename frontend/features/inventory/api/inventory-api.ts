import type { AdjustmentStatus, InventoryAdjustment, InventoryItem, InventoryMovement, Warehouse } from "@/features/inventory/types/inventory.types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type InventoryBootstrap = {
  warehouses: Warehouse[];
  items: InventoryItem[];
  movements: InventoryMovement[];
  adjustments: InventoryAdjustment[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error(`Cannot reach the inventory API at ${API_BASE}. Make sure the backend is running.`);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(payload?.detail ?? `Inventory request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export const inventoryApi = {
  load: () => request<InventoryBootstrap>("/inventory/bootstrap"),
  addWarehouse: (payload: { actor_id: string; code: string; name: string }) =>
    request<{ ok: true }>("/inventory/warehouses", { method: "POST", body: JSON.stringify(payload) }),
  addItem: (payload: {
    actor_id: string; code: string; name: string; category: string; unit: string;
    warehouse_id: string; on_hand: number; reorder_at: number;
  }) => request<{ ok: true }>("/inventory/items", { method: "POST", body: JSON.stringify(payload) }),
  submitAdjustment: (payload: {
    actor_id: string; item_code: string; warehouse_id: string;
    direction: "Increase" | "Decrease"; quantity: number;
    reason: string; notes: string;
  }) => request<{ ok: true }>("/inventory/adjustments", { method: "POST", body: JSON.stringify(payload) }),
  reviewAdjustment: (
    referenceCode: string,
    payload: { reviewer_id: string; decision: Extract<AdjustmentStatus, "Approved" | "Returned">; note?: string },
  ) => request<{ ok: true }>(`/inventory/adjustments/${encodeURIComponent(referenceCode)}/review`, {
    method: "POST", body: JSON.stringify(payload),
  }),
};
