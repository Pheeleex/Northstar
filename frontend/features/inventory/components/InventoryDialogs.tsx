import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import type { InventoryItem, Warehouse } from "@/features/inventory/types/inventory.types";
import { AddInventoryItemDialog } from "@/features/inventory/components/AddInventoryItemDialog";
import { OpeningStockDialog } from "@/features/inventory/components/OpeningStockDialog";
import { AddWarehouseDialog } from "@/features/inventory/components/AddWarehouseDialog";
import { InventoryAdjustmentDialog } from "@/features/inventory/components/InventoryAdjustmentDialog";

type InventoryDialogsProps = {
  showItemForm: boolean;
  setShowItemForm: Dispatch<SetStateAction<boolean>>;
  showOpeningStockForm: boolean;
  setShowOpeningStockForm: Dispatch<SetStateAction<boolean>>;
  showWarehouseForm: boolean;
  setShowWarehouseForm: Dispatch<SetStateAction<boolean>>;
  showAdjustmentForm: boolean;
  setShowAdjustmentForm: Dispatch<SetStateAction<boolean>>;
  openingStockItems: InventoryItem[];
  visibleItems: InventoryItem[];
  warehouses: Warehouse[];
  formError: string;
  addItem: FormEventHandler<HTMLFormElement>;
  submitOpeningStock: FormEventHandler<HTMLFormElement>;
  createWarehouse: FormEventHandler<HTMLFormElement>;
  submitAdjustment: FormEventHandler<HTMLFormElement>;
};

export function InventoryDialogs(props: InventoryDialogsProps) {
  return (
    <>
      <AddInventoryItemDialog
        showItemForm={props.showItemForm}
        setShowItemForm={props.setShowItemForm}
        warehouses={props.warehouses}
        formError={props.formError}
        addItem={props.addItem}
      />
      <OpeningStockDialog
        showOpeningStockForm={props.showOpeningStockForm}
        setShowOpeningStockForm={props.setShowOpeningStockForm}
        openingStockItems={props.openingStockItems}
        formError={props.formError}
        submitOpeningStock={props.submitOpeningStock}
      />
      <AddWarehouseDialog
        showWarehouseForm={props.showWarehouseForm}
        setShowWarehouseForm={props.setShowWarehouseForm}
        formError={props.formError}
        createWarehouse={props.createWarehouse}
      />
      <InventoryAdjustmentDialog
        showAdjustmentForm={props.showAdjustmentForm}
        setShowAdjustmentForm={props.setShowAdjustmentForm}
        visibleItems={props.visibleItems}
        formError={props.formError}
        submitAdjustment={props.submitAdjustment}
      />
    </>
  );
}
