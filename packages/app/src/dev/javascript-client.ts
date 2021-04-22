import { readFile } from "fs/promises";
import { resolve } from "path";
import babel from "@babel/core";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";
import cache from "./cache";

export default async (config: Config) => async (path: string) => {
  if (!/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(path)) {
    return;
  }

  let data = cache.typescript[path] ?? (await readFile(path, "utf8"));

  const result = await babel.transformAsync(data!, {
    filename: path,
    configFile: false,
    babelrc: false,
    compact: false,
    sourceMaps: true,
    presets: [[app, { target: "client", env: "development", inject: config.inject } as AppOptions]],
  });

  data = result!.code!;
  const map = result!.map!;

  if (!map.sourcesContent) {
    map.sourcesContent = await Promise.all(map.sources.map((source) => readFile(resolve(path, "..", source), "utf8")));
  }

  data += `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map), "utf8").toString(
    "base64",
  )}`;

  return data;
};
