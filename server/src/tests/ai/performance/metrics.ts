export function min(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.min(...arr);
}

export function max(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.max(...arr);
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return Number((sum / arr.length).toFixed(2));
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  if (arr.length === 1) return arr[0];
  
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sorted.length) return sorted[lower];
  
  return Number((sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(2));
}

export function p50(arr: number[]): number {
  return percentile(arr, 50);
}

export function p95(arr: number[]): number {
  return percentile(arr, 95);
}

export function p99(arr: number[]): number {
  return percentile(arr, 99);
}

export function successRate(successes: number, total: number): number {
  if (total === 0) return 0;
  return Number(((successes / total) * 100).toFixed(2));
}

export function failureRate(failures: number, total: number): number {
  if (total === 0) return 0;
  return Number(((failures / total) * 100).toFixed(2));
}

export function throughput(count: number, durationMs: number): number {
  if (durationMs === 0) return 0;
  return Number(((count / durationMs) * 1000).toFixed(2)); // operations per second
}
