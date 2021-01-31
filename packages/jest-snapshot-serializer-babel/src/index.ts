import type { BabelFileResult } from "@babel/core";
import prettier from "prettier";

const config = { ...prettier.resolveConfig.sync("index.js"), filepath: "index.js" };

export function test(value: any) {
  return !!value && typeof value.code === "string" && "ast" in value && "map" in value && "metadata" in value;
}

export function serialize(value: BabelFileResult) {
  return prettier.format(value.code!, config).trim();
}
