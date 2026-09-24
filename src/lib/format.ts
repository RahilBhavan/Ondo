/**
 * Number and date formatting utilities for dashboard display.
 * All monetary values display as USD. Large numbers use compact notation.
 */

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const USD_FULL = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const NUMBER_COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const PCT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatUsdCompact(value: number): string {
  return USD_COMPACT.format(value);
}

export function formatUsd(value: number): string {
  return USD_FULL.format(value);
}

export function formatNumberCompact(value: number): string {
  return NUMBER_COMPACT.format(value);
}

export function formatPercent(value: number): string {
  return PCT.format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
