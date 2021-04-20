import process from "process";
import type { ConfigAPI, default as babel, TransformOptions } from "@babel/core";
import constant from "@babel/plugin-transform-react-constant-elements";
import env, { Options as envOptions } from "@babel/preset-env";
import react from "@babel/preset-react";
import typescript from "@babel/preset-typescript";
import resolve, { Options as resolveOptions } from "@mo36924/babel-plugin-resolve";

type Api = ConfigAPI & typeof babel;

export type Options = {
  target?: "client" | "server";
};

const { NODE_TARGET } = process.env;

export default (_api: Api, options: Options): TransformOptions => {
  const target = (options.target ?? NODE_TARGET) === "client" ? "client" : "server";

  return {
    presets: [
      [
        env,
        {
          bugfixes: true,
          modules: false,
          loose: false,
          ignoreBrowserslistConfig: true,
          targets: {
            node: "14",
            chrome: "83",
          },
          useBuiltIns: false,
        } as envOptions,
      ],
      [typescript],
      [
        react,
        {
          runtime: "automatic",
          importSource: "react",
        },
      ],
    ],
    plugins: [
      [
        resolve,
        {
          ignoreBuiltins: true,
          ignoreBareImport: true,
          extensions: [
            `.${target}.tsx`,
            `.${target}.ts`,
            `.${target}.jsx`,
            `.${target}.mjs`,
            `.${target}.js`,
            `.${target}.cjs`,
            `.${target}.json`,
            ".tsx",
            ".ts",
            ".jsx",
            ".mjs",
            ".js",
            ".cjs",
            ".json",
            ".node",
          ],
        } as resolveOptions,
      ],
      [constant],
    ],
  };
};
