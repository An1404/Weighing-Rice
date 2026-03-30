export type BagWeight = number | null;

export type WeighSession = {
  id: string;
  createdAt: number;
  price: number;
  bags: BagWeight[];
  totalTareKg: number | null;
  completed: boolean;
};

export type ResultTab = 'summary' | 'bags';

export type SessionSummary = {
  bagValues: number[];
  totalBags: number;
  totalWeight: number;
  tare: number;
  netWeight: number;
  grossMoney: number;
  finalMoney: number;
};
