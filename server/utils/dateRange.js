/**
 * Resolve a query into a { $gte, $lte } date filter.
 *
 * Accepts either explicit start/end (ISO strings) OR a named period:
 *   'week' | 'month' | 'year' | 'all'
 * Falls back to the current month when nothing usable is given.
 */
export const resolveDateRange = ({ start, end, period }) => {
  if (start || end) {
    const range = {};
    if (start) range.$gte = new Date(start);
    if (end) {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      range.$lte = e;
    }
    return range;
  }

  const now = new Date();
  switch (period) {
    case 'week': {
      const d = new Date(now);
      d.setDate(now.getDate() - 7);
      return { $gte: d, $lte: now };
    }
    case 'year':
      return { $gte: new Date(now.getFullYear(), 0, 1), $lte: now };
    case 'all':
      return {}; // no filter
    case 'month':
    default:
      return { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lte: now };
  }
};

/**
 * Start-of-period boundary used to measure budget spend (monthly or yearly).
 */
export const periodStart = (period) => {
  const now = new Date();
  return period === 'yearly'
    ? new Date(now.getFullYear(), 0, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
};
