import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import type { InventoryItem } from "@/features/inventory/types/inventory.types";

type OpeningStockDialogProps = {
  showOpeningStockForm: boolean;
  setShowOpeningStockForm: Dispatch<SetStateAction<boolean>>;
  openingStockItems: InventoryItem[];
  formError: string;
  submitOpeningStock: FormEventHandler<HTMLFormElement>;
};

export function OpeningStockDialog({
  showOpeningStockForm,
  setShowOpeningStockForm,
  openingStockItems,
  formError,
  submitOpeningStock,
}: OpeningStockDialogProps) {
  return (
    <>
      {showOpeningStockForm && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setShowOpeningStockForm(false);
          }}
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="opening-stock-title"
          >
            <div className="dialog-head">
              <div>
                <h2 id="opening-stock-title">Set opening stock</h2>
                <p>
                  This one-time initial balance is separate from stock
                  adjustments.
                </p>
              </div>
              <button
                type="button"
                className="dialog-close"
                aria-label="Close"
                onClick={() => setShowOpeningStockForm(false)}
              >
                ×
              </button>
            </div>
            <form className="item-form" onSubmit={submitOpeningStock}>
              <label>
                Item and warehouse
                <select name="itemLocation" required defaultValue="">
                  <option value="" disabled>
                    Select an empty stock record
                  </option>
                  {openingStockItems.map((item) => (
                    <option
                      key={`${item.code}-${item.warehouse}`}
                      value={`${item.code}::${item.warehouse}`}
                    >
                      {item.name} · {item.warehouse} · {item.code}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Opening quantity
                <input
                  name="quantity"
                  type="number"
                  min="0.001"
                  step="0.001"
                  required
                  placeholder="0"
                />
              </label>
              <label>
                Reference <span className="item-sub">optional</span>
                <input
                  name="reference"
                  maxLength={80}
                  placeholder="e.g. Opening count 2026-10"
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
                  onClick={() => setShowOpeningStockForm(false)}
                >
                  Cancel
                </button>
                <button className="button-primary" type="submit">
                  Set opening balance
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
