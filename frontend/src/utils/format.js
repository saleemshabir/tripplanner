export function formatMoney(amount, currency = 'INR') {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(n);
  } catch {
    // Fall back gracefully if an unusual currency code is used.
    return `${currency} ${n.toLocaleString()}`;
  }
}
