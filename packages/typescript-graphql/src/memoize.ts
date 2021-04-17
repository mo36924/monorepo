export type Cache<K, V> = {
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): void;
};

export const memoize = <K, V>(fn: (value: K) => V, cache: Cache<K, V> = new Map<K, V>()) => (value: K) => {
  if (cache.has(value)) {
    return cache.get(value)!;
  }

  const result = fn(value);
  cache.set(value, result);
  return result;
};
