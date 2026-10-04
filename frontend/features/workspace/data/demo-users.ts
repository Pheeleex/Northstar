export type DemoEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  displayName?: string;
  warehouse?: string;
};

export const demoEmployees: DemoEmployee[] = [
  { id: "grace-okafor", firstName: "Grace", lastName: "Okafor", role: "Operations Manager" },
  { id: "tunde-bello", firstName: "Tunde", lastName: "Bello", role: "Procurement Officer" },
  { id: "amaka-nwosu", firstName: "Amaka", lastName: "Nwosu", role: "Warehouse Lead", warehouse: "Lagos Main Warehouse" },
  { id: "chidi-okoye", firstName: "Chidi", lastName: "Okoye", role: "Warehouse Lead", warehouse: "Ikeja Warehouse 1" },
  { id: "muna-bello", firstName: "Muna", lastName: "Bello", role: "Warehouse Lead", warehouse: "Ikeja Warehouse 2" },
  { id: "david-mensah", firstName: "David", lastName: "Mensah", role: "Quality Manager" },
  { id: "sarah-adeyemi", firstName: "Sarah", lastName: "Adeyemi", role: "Finance Approver" },
  { id: "michael-cole", firstName: "Michael", lastName: "Cole", role: "Managing Director" },
  { id: "inventory-admin", firstName: "Inventory", lastName: "Admin", displayName: "Inventory Admin", role: "Inventory Admin" },
];
