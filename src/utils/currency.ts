/**
 * Format amount in cents to Indian Rupees
 * @param amountInCents - Amount in smallest currency unit (paise)
 * @returns Formatted rupee string (₹1,23,456.78)
 */
export function formatRupees(amountInCents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountInCents / 100);
}

/**
 * Format amount without currency symbol
 * @param amountInCents - Amount in smallest currency unit (paise)
 * @returns Formatted number string (1,23,456.78)
 */
export function formatRupeesWithoutSymbol(amountInCents: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountInCents / 100);
}

/**
 * Format amount as whole rupees (no decimals)
 * @param amountInCents - Amount in smallest currency unit (paise)
 * @returns Formatted rupee string (₹1,23,457)
 */
export function formatRupeesWhole(amountInCents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amountInCents / 100));
}
