export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export const createObjectNull = <T = any>(): T => Object.create(null);
export const createObject = <T extends readonly any[]>(
  ...sources: [...T]
): UnionToIntersection<Exclude<T[number], null | undefined>> => Object.assign(createObjectNull<{}>(), ...sources);
