import prettier, { Options } from "prettier";

const { format: _format, resolveConfig } = prettier;
const RAW = Symbol.for("jest-snapshot-serializer-prettier");

export type Wrapper = {
  [RAW]: string;
};
export const test = (value: any): value is Wrapper => value && typeof value[RAW] === "string";
export const serialize = (value: Wrapper): string => value[RAW];

export const format = (value: string, options?: Options): Wrapper => {
  const filepath = options?.filepath ?? "index.js";
  const formatted = _format(value, { ...resolveConfig.sync(filepath), ...options, filepath }).trim();
  return { [RAW]: formatted };
};
