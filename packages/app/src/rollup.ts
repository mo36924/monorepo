import { builtinModules } from "module";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import graphql from "@mo36924/rollup-plugin-graphql";
import _static from "@mo36924/rollup-plugin-static";
import vfs from "@mo36924/rollup-plugin-vfs";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
// @ts-ignore
import jsx from "acorn-jsx";
import { rollup } from "rollup";
import { terser } from "rollup-plugin-terser";

export default async () => {
  // let bundle = await rollup({
  //   input: "lib/index.client.ts",
  //   acornInjectPlugins: [jsx()],
  //   external: [],
  //   preserveEntrySignatures: false,
  //   context: "self",
  //   plugins: [
  //     vfs({
  //       "node_modules/pg/lib/native/index.js": "export default {};",
  //     }),
  //     typescript({
  //       sourceMap: false,
  //       inlineSourceMap: false,
  //       inlineSources: false,
  //     }),
  //     json({ compact: true, namedExports: true, preferConst: true }),
  //     graphql(),
  //     resolve({
  //       extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
  //       browser: true,
  //       exportConditions: ["browser", "import", "require"],
  //       mainFields: ["browser", "module", "main"],
  //       preferBuiltins: false,
  //     }),
  //     commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: false, sourceMap: false }),
  //     babel({
  //       extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
  //       babelrc: false,
  //       configFile: false,
  //       compact: false,
  //       babelHelpers: "bundled",
  //       sourceMaps: false,
  //       presets: [[app, { target: "client", env: "production" } as AppOptions]],
  //     }),
  //   ],
  // });

  // const { output } = await bundle.generate({
  //   dir: "dist",
  //   format: "module",
  //   sourcemap: false,
  //   compact: true,
  //   minifyInternalExports: true,
  //   entryFileNames: "index.js",
  //   chunkFileNames: "index.js",
  // });

  // const files: { [path: string]: string } = Object.create(null);

  // for (const chunk of output) {
  //   if (chunk.type === "chunk") {
  //     files[`/${chunk.fileName}`];
  //   }
  // }

  // await bundle.close();

  const bundle = await rollup({
    input: "lib/index.ts",
    acornInjectPlugins: [jsx()],
    external: builtinModules,
    preserveEntrySignatures: false,
    context: "globalThis",
    plugins: [
      vfs({
        "node_modules/pg/lib/native/index.js": "export default {};",
      }),
      _static(),
      typescript({
        sourceMap: true,
        inlineSourceMap: false,
        inlineSources: true,
      }),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      resolve({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        browser: false,
        exportConditions: ["import", "require"],
        mainFields: ["module", "main"],
        preferBuiltins: true,
      }),
      commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: true, sourceMap: true }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        babelHelpers: "bundled",
        sourceMaps: true,
        presets: [[app, { target: "server", env: "production" } as AppOptions]],
      }),
      terser({ ecma: 2020, module: true, compress: { passes: 10 } }),
    ],
  });

  await bundle.write({
    dir: "dist",
    format: "module",
    sourcemap: true,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: "index.js",
    chunkFileNames: "index.js",
  });

  await bundle.close();
};
