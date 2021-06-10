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
