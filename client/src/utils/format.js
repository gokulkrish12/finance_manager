import { format, formatDistanceToNowStrict } from 'date-fns';

// Currency formatter that respects the user's chosen currency.
export const money = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
};

// Compact form for chart axes / big numbers (1.2K, 3.4M).
export const compact = (amount) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(amount || 0);

export const fmtDate = (d) => (d ? format(new Date(d), 'MMM d, yyyy') : '');
export const fmtDateInput = (d) => (d ? format(new Date(d), 'yyyy-MM-dd') : '');
export const fromNow = (d) => (d ? formatDistanceToNowStrict(new Date(d), { addSuffix: true }) : '');

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CHF'];
