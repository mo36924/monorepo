import { join, resolve } from "path";
import glob from "fast-glob";
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
    sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost) + sys.newLine);
  },
  (diagnostic, newLine, _options, errorCount) => {
    sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost) + newLine);

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

  const cachePlugin = {
    resolveId(source, importer) {
      if (!importer) {
        return resolve(source.replace(/\.ts(x)?$/, ".js$1"));
      }

      source = join(importer, "..", source + ".js");

      if (!(source in cache)) {
        source += "x";
      }

      return source;
    },
    load(id) {
      if (id in cache) {
        return { code: cache[id], map: cache[id + ".map"] };
      }

      throw new Error(`Could not resolve '${id}'`);
    },
  };

  const [paths, clients, bins] = await Promise.all([
    glob("packages/*/src/index.{ts,tsx}"),
    glob("packages/*/src/index.client.{ts,tsx}"),
    glob("packages/*/src/bin.ts"),
  ]);

  for (const path of paths) {
    const dir = resolve(path, "..", "..", "dist");

    options.push(
      {
        input: path,
        output: [
          {
            file: resolve(dir, "index.js"),
            format: "commonjs",
            sourcemap: true,
            sourcemapExcludeSources: true,
            preferConst: true,
            exports: "auto",
            inlineDynamicImports: true,
          },
          {
            file: resolve(dir, "index.mjs"),
            format: "module",
            sourcemap: true,
            sourcemapExcludeSources: true,
            preferConst: true,
            inlineDynamicImports: true,
          },
        ],
        external,
        plugins: [cachePlugin],
      },
      {
        input: path,
        output: {
          file: resolve(dir, "index.d.ts"),
          format: "module",
        },
        external,
        plugins: [dts()],
      },
    );
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
      plugins: [cachePlugin],
    });
  }

  for (const bin of bins) {
    const dir = resolve(bin, "..", "..", "dist");

    options.push({
      input: bin,
      output: {
        file: resolve(dir, "bin.js"),
        format: "commonjs",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        inlineDynamicImports: true,
      },
      external,
      plugins: [cachePlugin],
    });
  }

  return options;
};
