import InventoryRegister from "@/components/inventory/InventoryRegister";

export default function InventoryPage() {
  return <>
    <div className="page-heading">
      <div><div className="eyebrow">Stock control</div><h1>Inventory</h1><p className="subtitle">See what you have, where it is, and what needs attention.</p></div>
    </div>
    <InventoryRegister/>
  </>;
}
