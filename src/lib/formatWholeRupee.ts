const wholeRupeeFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatWholeRupee(value: number): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return wholeRupeeFormatter.format(Math.round(numeric));
}
