import { DataSource } from '../types';

export function isInCooldown(source: DataSource): boolean {
  if (!source.fail_count || source.fail_count < 3) return false;
  if (!source.last_fail_time) return false;
  const lastFail = new Date(source.last_fail_time).getTime();
  return Date.now() - lastFail < 5 * 60 * 1000;
}