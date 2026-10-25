import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import type { InventoryItem } from "@/features/inventory/types/inventory.types";

type InventoryAdjustmentDialogProps = {
  showAdjustmentForm: boolean;
  setShowAdjustmentForm: Dispatch<SetStateAction<boolean>>;
  visibleItems: InventoryItem[];
  formError: string;
  submitAdjustment: FormEventHandler<HTMLFormElement>;
};

export function InventoryAdjustmentDialog({
  showAdjustmentForm,
  setShowAdjustmentForm,
  visibleItems,
  formError,
  submitAdjustment,
}: InventoryAdjustmentDialogProps) {
  return (
    <>
      {showAdjustmentForm && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setShowAdjustmentForm(false);
          }}
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adjustment-title"
          >
            <div className="dialog-head">
              <div>
                <h2 id="adjustment-title">Request stock adjustment</h2>
                <p>
                  Inventory Admin must review this request before the stock
                  balance changes.
                </p>
              </div>
              <button
                type="button"
                className="dialog-close"
                aria-label="Close"
                onClick={() => setShowAdjustmentForm(false)}
              >
                ×
              </button>
            </div>
            <form className="item-form" onSubmit={submitAdjustment}>
              <label>
                Item and warehouse
                <select name="itemLocation" required defaultValue="">
                  <option value="" disabled>
                    Select an item
                  </option>
                  {visibleItems.map((item) => (
                    <option
                      key={`${item.code}-${item.warehouse}`}
                      value={`${item.code}::${item.warehouse}`}
                    >
                      {item.name} · {item.warehouse} ·{" "}
                      {item.onHand.toLocaleString()} {item.unit}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label>
                  Adjustment type
                  <select name="direction">
                    <option>Decrease</option>
                    <option>Increase</option>
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    name="quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="0"
                  />
                </label>
              </div>
              <label>
                Reason
                <select name="reason" required defaultValue="">
                  <option value="" disabled>
                    Select a reason
                  </option>
                  <option>Count variance</option>
                  <option>Damage or spoilage</option>
                  <option>Receiving correction</option>
                  <option>Expiry</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Explain the reason
                <textarea
                  name="notes"
                  required
                  minLength={8}
                  rows={3}
                  placeholder="Describe what happened and how the quantity was confirmed."
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
                  onClick={() => setShowAdjustmentForm(false)}
                >
                  Cancel
                </button>
                <button className="button-primary" type="submit">
                  Submit for review
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
