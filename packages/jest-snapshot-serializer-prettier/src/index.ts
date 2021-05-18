import { format as prettierFormat, Options, resolveConfig } from "@mo36924/prettier";

const RAW = Symbol.for("jest-snapshot-serializer-prettier");

export type Wrapper = {
  [RAW]: string;
};
export const test = (value: any): value is Wrapper => value && typeof value[RAW] === "string";
export const serialize = (value: Wrapper): string => value[RAW];

export const format = (value: string, options?: Options): Wrapper => {
  const filepath = options?.filepath ?? "index.js";
  const formatted = prettierFormat(value, { ...resolveConfig.sync(filepath), ...options, filepath });
  return { [RAW]: formatted };
};
