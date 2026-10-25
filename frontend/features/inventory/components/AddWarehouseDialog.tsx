import type { Dispatch, FormEventHandler, SetStateAction } from "react";

type AddWarehouseDialogProps = {
  showWarehouseForm: boolean;
  setShowWarehouseForm: Dispatch<SetStateAction<boolean>>;
  formError: string;
  createWarehouse: FormEventHandler<HTMLFormElement>;
};

export function AddWarehouseDialog({
  showWarehouseForm,
  setShowWarehouseForm,
  formError,
  createWarehouse,
}: AddWarehouseDialogProps) {
  return (
    <>
      {showWarehouseForm && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setShowWarehouseForm(false);
          }}
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-warehouse-title"
          >
            <div className="dialog-head">
              <div>
                <h2 id="add-warehouse-title">Add warehouse</h2>
                <p>The new location is saved to the workspace database.</p>
              </div>
              <button
                type="button"
                className="dialog-close"
                aria-label="Close"
                onClick={() => setShowWarehouseForm(false)}
              >
                ×
              </button>
            </div>
            <form className="item-form" onSubmit={createWarehouse}>
              <label>
                Warehouse name
                <input
                  name="name"
                  required
                  maxLength={60}
                  placeholder="e.g. Abuja Warehouse"
                  autoFocus
                />
              </label>
              <label>
                Warehouse code
                <input
                  name="code"
                  required
                  maxLength={12}
                  pattern="[A-Za-z0-9-]+"
                  title="Use letters, numbers, and hyphens only"
                  placeholder="e.g. ABJ-01"
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
                  onClick={() => setShowWarehouseForm(false)}
                >
                  Cancel
                </button>
                <button className="button-primary" type="submit">
                  Add warehouse
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
