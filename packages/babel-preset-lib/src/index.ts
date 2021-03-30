import process from "process";
import type { ConfigAPI, default as babel, TransformOptions } from "@babel/core";
// @ts-ignore
import constant from "@babel/plugin-transform-react-constant-elements";
import env, { Options as envOptions } from "@babel/preset-env";
// @ts-ignore
import react from "@babel/preset-react";
// @ts-ignore
import typescript from "@babel/preset-typescript";
import deadCodeElimination from "@mo36924/babel-plugin-dead-code-elimination";
import type { Options as injectOptions } from "@mo36924/babel-plugin-inject";
import resolve, { Options as resolveOptions } from "@mo36924/babel-plugin-resolve";

type Api = ConfigAPI & typeof babel;

export type Options = {
  target?: "client" | "server";
  inject?: injectOptions;
};

const { NODE_TARGET } = process.env;

export default (_api: Api, options: Options): TransformOptions => {
  const { target = NODE_TARGET ?? "server", inject: _inject = {} } = options;
  const server = target === "server";

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
      [deadCodeElimination],
      [
        resolve,
        {
          ignoreBuiltins: true,
          ignoreBareImport: true,
          extensions: server
            ? [
                ".server.tsx",
                ".server.ts",
                ".server.jsx",
                ".server.mjs",
                ".server.js",
                ".server.cjs",
                ".server.json",
                ".tsx",
                ".ts",
                ".jsx",
                ".mjs",
                ".js",
                ".cjs",
                ".json",
                ".node",
              ]
            : [
                ".client.tsx",
                ".client.ts",
                ".client.jsx",
                ".client.mjs",
                ".client.js",
                ".client.cjs",
                ".client.json",
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
