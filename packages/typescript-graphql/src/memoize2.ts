import type { Cache } from "./memoize";

export const memoize2 = <K1, K2 extends object, V>(
  fn: (k1: K1, k2: K2) => V,
  cache: Cache<K1, Cache<K2, V>> = new Map<K1, Cache<K2, V>>(),
) => (k1: K1, k2: K2) => {
  let cache1 = cache.get(k1);

  if (cache1 === undefined) {
    cache1 = new WeakMap<K2, V>();
    cache.set(k1, cache1);
  }

  if (cache1.has(k2)) {
    return cache1.get(k2)!;
  }

  const result = fn(k1, k2);
  cache1.set(k2, result);
  return result;
};
