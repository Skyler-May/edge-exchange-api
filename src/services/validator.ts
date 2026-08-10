export function validateRate(rate: number, base: string, target: string): boolean {
  if (typeof rate !== 'number' || isNaN(rate) || rate <= 0) return false;
  if (base === 'BTC' && target === 'USDT' && (rate < 1000 || rate > 200000)) return false;
  if (base === 'ETH' && target === 'USDT' && (rate < 100 || rate > 20000)) return false;
  return true;
}