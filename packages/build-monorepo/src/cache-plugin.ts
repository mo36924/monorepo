import { resolve } from "path";
import MagicString from "magic-string";
import type { Plugin } from "rollup";
import ts, { FormatDiagnosticsHost } from "typescript";

export default (): Plugin => {
  const sys = ts.sys;
  const cwd = process.cwd();

  const formatDiagnosticsHost: FormatDiagnosticsHost = {
    getCurrentDirectory: () => cwd,
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => sys.newLine,
  };

  const cache = Object.create(null);

  const host = ts.createWatchCompilerHost(
    "tsconfig.json",
    {
      noEmit: false,
      outDir: undefined,
      sourceMap: true,
      inlineSourceMap: false,
      inlineSources: true,
    },
    {
      ...sys,
      writeFile(path, data) {
        cache[path.replace(/\.js(x)?(\.map)?$/, ".ts$1$2")] = data;
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

  if (process.exitCode === 1) {
    process.exit();
  }

  return {
    name: "cache",
    resolveId(source, importer = "index.ts") {
      const id = resolve(importer, "..", source);

      if (id in cache) {
        return id;
      }

      throw new Error(`Can't resolve ${source}`);
    },
    load(id) {
      if (id in cache) {
        return { code: cache[id], map: cache[id + ".map"] };
      }

      throw new Error(`Could not load '${id}'`);
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
};
