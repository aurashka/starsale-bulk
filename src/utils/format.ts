/**
 * Safe formatting utilities for currency and dates.
 * Guarantees zero runtime crashes even when fields are undefined, null, or invalid.
 */

export const formatPrice = (val?: number | string | null): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
};

export const formatDate = (val?: string | number | Date | null): string => {
  if (!val) return new Date().toLocaleString('en-IN');
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date().toLocaleString('en-IN') : d.toLocaleString('en-IN');
};
