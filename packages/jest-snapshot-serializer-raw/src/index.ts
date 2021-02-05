const RAW = Symbol.for("jest-snapshot-serializer-raw");

export type Wrapper = {
  [RAW]: string;
};
export const test = (value: any): value is Wrapper => value && typeof value[RAW] === "string";
export const serialize = (value: Wrapper): string => value[RAW];
export const raw = (value: string): Wrapper => ({ [RAW]: value });
