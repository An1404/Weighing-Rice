import { SessionSummary, WeighSession } from '../types';

export const formatNumber = (value: number) =>
  value.toLocaleString('vi-VN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });

export const formatDateTime = (time: number) =>
  new Date(time).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const parsePositiveNumber = (raw: string): number | null => {
  const value = raw.trim().replace(',', '.');
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export const calcSummary = (session: WeighSession): SessionSummary => {
  const bagValues = session.bags.filter((bag): bag is number => bag !== null);
  const totalBags = bagValues.length;
  const totalWeight = bagValues.reduce((sum, bag) => sum + bag, 0);
  const tare = Math.max(session.totalTareKg ?? 0, 0);
  const netWeight = Math.max(totalWeight - tare, 0);
  const grossMoney = totalWeight * session.price;
  const finalMoney = netWeight * session.price;

  return {
    bagValues,
    totalBags,
    totalWeight,
    tare,
    netWeight,
    grossMoney,
    finalMoney,
  };
};
