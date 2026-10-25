import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import type { Warehouse } from "@/features/inventory/types/inventory.types";

type AddInventoryItemDialogProps = {
  showItemForm: boolean;
  setShowItemForm: Dispatch<SetStateAction<boolean>>;
  warehouses: Warehouse[];
  formError: string;
  addItem: FormEventHandler<HTMLFormElement>;
};

export function AddInventoryItemDialog({
  showItemForm,
  setShowItemForm,
  warehouses,
  formError,
  addItem,
}: AddInventoryItemDialogProps) {
  return (
    <>
      {showItemForm && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowItemForm(false);
          }}
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-item-title"
          >
            <div className="dialog-head">
              <div>
                <h2 id="add-item-title">Add inventory item</h2>
                <p>
                  Add the item to a warehouse and optionally record its initial
                  stock.
                </p>
              </div>
              <button
                type="button"
                className="dialog-close"
                aria-label="Close"
                onClick={() => setShowItemForm(false)}
              >
                ×
              </button>
            </div>
            <form className="item-form" onSubmit={addItem}>
              <label>
                Item name
                <input
                  name="name"
                  required
                  placeholder="e.g. Raw cocoa beans"
                  autoFocus
                />
              </label>
              <div className="form-row">
                <label>
                  Item code
                  <input name="code" required placeholder="e.g. RM-014" />
                </label>
                <label>
                  Category
                  <select name="category">
                    <option>Raw material</option>
                    <option>Packaging</option>
                    <option>Finished goods</option>
                    <option>Consumables</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Unit
                  <input name="unit" required placeholder="kg, L, pcs" />
                </label>
                <label>
                  Reorder level
                  <input
                    name="reorderAt"
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0"
                  />
                </label>
              </div>
              <label>
                Warehouse
                <select name="warehouse" required defaultValue="">
                  <option value="" disabled>
                    Select a warehouse
                  </option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.name}>
                      {warehouse.name} · {warehouse.code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Opening stock <span className="item-sub">optional</span>
                <input
                  name="openingStock"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="Leave blank if stock has not been counted yet"
                />
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="dialog-actions">
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => setShowItemForm(false)}
                >
                  Cancel
                </button>
                <button className="button-primary" type="submit">
                  Add to register
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
