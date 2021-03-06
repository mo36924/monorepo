import { join, parse, relative, resolve } from "path";
import presetEnv from "@babel/preset-env";
import presetReact from "@babel/preset-react";
import { babel } from "@rollup/plugin-babel";
import resolveSubpath from "babel-plugin-resolve-subpath";
import glob from "fast-glob";
import MagicString from "magic-string";
import dts from "rollup-plugin-dts";
import ts from "typescript";

const sys = ts.sys;
const cwd = sys.getCurrentDirectory();

const formatDiagnosticsHost = {
  getCurrentDirectory: () => cwd,
  getCanonicalFileName: (fileName) => fileName,
  getNewLine: () => sys.newLine,
};

const cache = Object.create(null);

const host = ts.createWatchCompilerHost(
  "tsconfig.json",
  {
    noEmit: false,
    outDir: false,
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: false,
  },
  {
    ...sys,
    writeFile(path, data) {
      cache[path] = data;
    },
  },
  ts.createEmitAndSemanticDiagnosticsBuilderProgram,
  (diagnostic) => {
    sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));
  },
  (diagnostic, _newLine, _options, errorCount) => {
    sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));

    if (errorCount) {
      process.exitCode = 1;
    }
  },
);

ts.createWatchProgram(host).close();

if (process.exitCode === 1 && process.env.NODE_ENV !== "development") {
  process.exit();
}

export default async () => {
  /** @type {import("rollup").RollupOptions[]} */
  const options = [];
  const external = (id) => /^@?[A-Za-z]/.test(id);

  /** @type {import("rollup").Plugin} */
  const cachePlugin = {
    resolveId(source, importer) {
      if (!importer) {
        const _source = resolve(source.replace(/\.ts(x)?$/, ".js$1"));

        if (_source in cache) {
          return _source;
        }

        throw new Error(`Can't resolve ${source}`);
      }

      const js = join(importer, "..", source + ".js");
      const jsx = js + "x";

      if (js in cache) {
        return js;
      }

      if (jsx in cache) {
        return jsx;
      }

      throw new Error(`Can't resolve ${source}`);
    },
    load(id) {
      if (id in cache) {
        return { code: cache[id], map: cache[id + ".map"] };
      }

      throw new Error(`Could not resolve '${id}'`);
    },
    renderChunk(code, chunk) {
      if (!chunk.isEntry || chunk.name !== "bin") {
        return null;
      }

      const magicString = new MagicString(code);
      magicString.prepend("#!/usr/bin/env node\n");
      return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) };
    },
  };

  const babelPlugin = babel({
    configFile: false,
    babelrc: false,
    babelHelpers: "bundled",
    presets: [
      [
        presetEnv,
        {
          bugfixes: true,
          modules: false,
          loose: false,
          ignoreBrowserslistConfig: true,
          targets: {
            node: true,
          },
          useBuiltIns: false,
        },
      ],
      [
        presetReact,
        {
          runtime: "automatic",
          development: false,
          importSource: "preact",
        },
      ],
    ],
    plugins: [[resolveSubpath]],
  });

  /** @type {import("rollup").Plugin[]} */
  const plugins = [cachePlugin, babelPlugin];

  const [paths, clients, bins] = await Promise.all(
    ["packages/*/src/index.{ts,tsx}", "packages/*/src/index.client.{ts,tsx}", "packages/*/src/bin.ts"].map((source) =>
      glob(source, { absolute: true }),
    ),
  );

  const binSet = new Set(bins);
  const dtsInput = [];

  for (const path of paths) {
    const dir = resolve(path, "..", "..", "dist");
    const bin = resolve(path, "..", "bin.ts");
    const input = [path];

    if (binSet.has(bin)) {
      input.push(bin);
      binSet.delete(bin);
    }

    dtsInput.push(...input);

    options.push({
      input,
      output: [
        {
          dir,
          format: "module",
          sourcemap: true,
          sourcemapExcludeSources: true,
          preferConst: true,
        },
      ],
      external,
      plugins,
    });
  }

  for (const client of clients) {
    const dir = resolve(client, "..", "..", "dist");

    options.push({
      input: client,
      output: {
        file: resolve(dir, "index.client.js"),
        format: "module",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        inlineDynamicImports: true,
      },
      external,
      plugins,
    });
  }

  for (const bin of [...binSet]) {
    const dir = resolve(bin, "..", "..", "dist");

    options.push({
      input: bin,
      output: {
        dir,
        format: "module",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
      },
      external,
      plugins,
    });
  }

  options.push({
    input: Object.fromEntries(
      dtsInput.map((input) => [relative(cwd, resolve(input, "..", "..", "dist", parse(input).name)), input]),
    ),
    output: {
      dir: cwd,
      format: "module",
    },
    external,
    plugins: [dts.default()],
  });

  return options;
};
