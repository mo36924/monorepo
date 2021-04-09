import { readFile } from "fs/promises";
import babel from "@babel/core";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import cache from "./cache";
import type { Options } from "./type";

export default async (options: Options) => async (path: string) => {
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
    presets: [[app, { target: "server", env: "development", inject: options.inject } as AppOptions]],
  });

  return result!.code!;
};
