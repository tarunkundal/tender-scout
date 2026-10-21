const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

/** formatINR(4800000) -> "₹48,00,000" (Indian digit grouping). */
export function formatINR(amount: number): string {
  return inr.format(amount)
}

/**
 * formatINRShort(4800000) -> "₹48L", formatINRShort(12000000) -> "₹1.2Cr".
 * Amounts below 1 lakh fall back to formatINR.
 */
export function formatINRShort(amount: number): string {
  const sign = amount < 0 ? "-" : ""
  const abs = Math.abs(amount)
  const short = (n: number) => n.toFixed(1).replace(/\.0$/, "")
  if (abs >= 1e7) return `${sign}₹${short(abs / 1e7)}Cr`
  if (abs >= 1e5) return `${sign}₹${short(abs / 1e5)}L`
  return formatINR(amount)
}
