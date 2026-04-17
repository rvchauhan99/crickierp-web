const dashboardCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type FormatDashboardCurrencyOptions = {
  withSymbol?: boolean;
  includeSign?: boolean;
};

export function formatDashboardCurrency(value: number, options: FormatDashboardCurrencyOptions = {}) {
  const { withSymbol = true, includeSign = true } = options;
  const numericValue = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(numericValue);
  const sign = includeSign && numericValue < 0 ? "−" : "";
  const symbol = withSymbol ? "₹" : "";
  return `${sign}${symbol}${dashboardCurrencyFormatter.format(abs)}`;
}
