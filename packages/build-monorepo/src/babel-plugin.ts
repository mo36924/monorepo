import constant from "@babel/plugin-transform-react-constant-elements";
import env, { Options } from "@babel/preset-env";
import react from "@babel/preset-react";
import typescript from "@babel/preset-typescript";
import { babel } from "@rollup/plugin-babel";
import resolve from "babel-plugin-resolve";
import subpath from "babel-plugin-resolve-subpath";

export default (target: string = "server") => {
  target = target === "client" ? "client" : "server";
  return babel({
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs"],
    configFile: false,
    babelrc: false,
    babelHelpers: "bundled",
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
        } as Options,
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
            `.tsx`,
            `.ts`,
            `.jsx`,
            `.mjs`,
            `.js`,
            `.cjs`,
            `.json`,
            `.node`,
          ],
        },
      ],
      [subpath],
      [constant],
    ],
  });
};
