import { readFile } from "fs/promises";
import babel from "@babel/core";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";
import cache from "./cache";

export default async (config: Config) => async (path: string) => {
  if (!/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(path)) {
    return;
  }

  const data = cache.typescript[path] ?? (await readFile(path, "utf8"));

  const result = await babel.transformAsync(data!, {
    filename: path,
    configFile: false,
    babelrc: false,
    compact: false,
    sourceMaps: "inline",
    presets: [[app, { target: "server", env: "development", inject: config.inject } as AppOptions]],
  });

  return result!.code!;
};
