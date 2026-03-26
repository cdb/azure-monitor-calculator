/**
 * Utility to format numbers as currency and other display formats.
 */

export function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function currencyCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 10_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return currency(value);
}

export function number(value: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function percent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function gbPerDay(value: number): string {
  return `${number(value)} GB/day`;
}
