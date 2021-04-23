import babel from "@babel/core";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";

export default async (config: Config) => async (path: string, data: string) => {
  if (!/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(path)) {
    return;
  }

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
