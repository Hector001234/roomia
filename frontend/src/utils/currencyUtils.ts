/**
 * Section 14.1 Compliance: Currency utility in camelCase (currencyUtils.ts).
 */
export const DEFAULT_CURRENCY = 'MXN';

export function formatCurrencyAmount(decimalAmount: string, currency: string = DEFAULT_CURRENCY): string {
  const numericValue = Number.parseFloat(decimalAmount);
  if (Number.isNaN(numericValue)) {
    return '$0.00 MXN';
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}
