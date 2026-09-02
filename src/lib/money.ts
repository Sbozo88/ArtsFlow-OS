/**
 * Money utilities for ArtsFlow OS.
 * All monetary values are stored in minor units (integer cents) to ensure zero floating point inaccuracies.
 * E.g. R450.00 is stored as 45000 cents.
 */

export const toCents = (amountInMajor: number | string): number => {
  const parsed = typeof amountInMajor === 'string' ? parseFloat(amountInMajor) : amountInMajor;
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};

export const toMajor = (cents: number): number => {
  if (!cents || isNaN(cents)) return 0;
  return cents / 100;
};

export const formatMoney = (cents: number | undefined | null, currency: string = 'ZAR'): string => {
  const safeCents = cents ?? 0;
  const majorValue = safeCents / 100;

  // Format currency prefix
  const symbol = currency === 'ZAR' ? 'R' : currency + ' ';
  
  return `${symbol}${majorValue.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const addMoney = (...cents: number[]): number => {
  return cents.reduce((acc, curr) => acc + (curr || 0), 0);
};

export const subtractMoney = (a: number, b: number): number => {
  return (a || 0) - (b || 0);
};

export const calculateBalance = (
  totalCents: number,
  paidCents: number,
  waivedCents: number = 0
): number => {
  const balance = (totalCents || 0) - (paidCents || 0) - (waivedCents || 0);
  return Math.max(0, balance);
};
