export type BagWeight = number | null;

export type WeighSession = {
  id: string;
  createdAt: number;
  price: number;
  bags: BagWeight[];
  completed: boolean;
};

export type ScreenState =
  | { name: 'list' }
  | { name: 'start' }
  | { name: 'detail'; sessionId: string }
  | { name: 'result'; sessionId: string };

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
