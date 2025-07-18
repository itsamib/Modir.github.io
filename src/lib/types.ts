export type PaymentStatus = "paid" | "unpaid";
export type ChargeTo = "all" | "owner" | "tenant";

export interface Unit {
  id: string;
  name: string; // Can be a translation key or a custom string
  unitNumber: number;
  area: number;
  occupants: number;
  ownerName: string;
  tenantName: string | null;
}

export interface Expense {
  id: string;
  buildingId: string;
  description: string; // Can be a translation key or a custom string
  totalAmount: number;
  date: string; // ISO string
  distributionMethod: "unit_count" | "occupants" | "area" | "custom" | "general";
  paymentStatus: Record<string, PaymentStatus>;
  paidByManager: boolean;
  chargeTo: ChargeTo;
  // For 'custom' distribution, indicates which units are included
  applicableUnits?: string[];
  // New fields for fund management
  isBuildingCharge?: boolean; // True if this expense is a contribution to the fund (e.g., monthly charge)
  deductFromFund?: boolean;   // True if this manager-paid expense should be deducted from the fund
}

export interface Building {
  id: string;
  name: string;
  units: Unit[];
  expenses: Expense[];
}
