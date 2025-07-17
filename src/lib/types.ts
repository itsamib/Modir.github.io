export type PaymentStatus = "paid" | "unpaid";
export type ChargeTo = "all" | "owner" | "tenant";

export interface Unit {
  id: string;
  name: string;
  area: number;
  occupants: number;
  ownerName: string;
  tenantName: string | null;
}

export interface Expense {
  id: string;
  buildingId: string;
  description: string;
  totalAmount: number;
  date: string; // ISO string
  distributionMethod: "unit_count" | "occupants" | "area" | "custom";
  // For 'custom' distribution, this maps unitId to a specific amount
  customAmounts?: Record<string, number>; 
  // For non-custom methods, this maps unitId to its payment status
  paymentStatus: Record<string, PaymentStatus>;
  paidByManager: boolean;
  chargeTo: ChargeTo;
  // For 'custom' distribution, indicates which units are included
  applicableUnits?: string[];
}

export interface Building {
  id: string;
  name: string;
  units: Unit[];
  expenses: Expense[];
}
