import { readFile } from "fs/promises";
import { transformAsync } from "@babel/core";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import cache from "./cache";
import type { Options } from "./type";

export default async (options: Options) => async (path: string) => {
  if (!/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(path)) {
    return;
  }

  let data = cache.server[path];

  if (data !== undefined) {
    return data;
  }

  data = cache.typescript[path];

  if (data === undefined) {
    data = await readFile(path, "utf8");
  }

  const result = await transformAsync(data!, {
    filename: path,
    configFile: false,
    babelrc: false,
    compact: false,
    sourceMaps: "inline",
    presets: [[app, { target: "server", env: "development", inject: options.inject } as AppOptions]],
  });

  data = result!.code!;
  cache.server[path] = data;
  return data;
};
