export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
export type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> };
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export const createObjectNull = <T = any>(): T => Object.create(null);
export const createObject = <T extends readonly any[]>(
  ...sources: T
): UnionToIntersection<Exclude<T[number], null | undefined>> => Object.assign(createObjectNull<{}>(), ...sources);
export const sleep = (ms: number = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

export const retry = async <T>(fn: () => T | Promise<T>, count: number = 60, interval: number = 1000): Promise<T> => {
  let error: any;

  while (count--) {
    try {
      const result = await fn();
      return result;
    } catch (_error) {
      if (count) {
        await sleep(interval);
      } else {
        error = _error;
      }
    }
  }

  throw error;
};

export type Cache<K, V> = {
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): void;
};

export const memoize =
  <K, V>(fn: (value: K) => V, cache: Cache<K, V> = new Map<K, V>()) =>
  (value: K) => {
    if (cache.has(value)) {
      return cache.get(value)!;
    }

    const result = fn(value);
    cache.set(value, result);
    return result;
  };

export const memoize2 =
  <K1, K2 extends object, V>(fn: (k1: K1, k2: K2) => V, cache: Cache<K1, Cache<K2, V>> = new Map<K1, Cache<K2, V>>()) =>
  (k1: K1, k2: K2) => {
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
