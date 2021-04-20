import type { BabelFileResult } from "@babel/core";
import { format, resolveConfig } from "@mo36924/prettier";

const config = { ...resolveConfig.sync("index.js"), filepath: "index.js" };

export function test(value: any) {
  return !!value && typeof value.code === "string" && "ast" in value && "map" in value && "metadata" in value;
}

export function serialize(value: BabelFileResult) {
  return format(value.code!, config).trim();
}
