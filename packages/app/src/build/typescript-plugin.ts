import { resolve } from "path";
import type { Config } from "@mo36924/config";
import { memoize } from "@mo36924/memoize";
import type { Plugin } from "rollup";
import ts from "typescript";

export default memoize(
  (config: Config): Plugin => {
    const cwd = process.cwd();
    const tsconfigPath = resolve("tsconfig.json");

    const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
      getCurrentDirectory: () => cwd,
      getCanonicalFileName: (fileName) => fileName,
      getNewLine: () => ts.sys.newLine,
    };

    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd);
    const cache: { [path: string]: string } = Object.create(null);

    const writeFile: ts.WriteFileCallback = (fileName, data) => {
      cache[fileName.replace(/\.js(x)?(\.map)?$/, ".ts$1$2")] = data;
    };

    const host: ts.CompilerHost = { ...ts.createCompilerHost(options), writeFile };
    const program = ts.createProgram({ options, rootNames: fileNames, configFileParsingDiagnostics: errors, host });
    const { diagnostics, emitSkipped } = program.emit();

    if (diagnostics.length) {
      const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, formatDiagnosticsHost);
      throw new Error(message);
    }

    if (emitSkipped) {
      throw new Error("emitSkipped");
    }

    return {
      name: "typescript-plugin",
      load(id) {
        if (id in cache && `${id}.map` in cache) {
          return { code: cache[id], map: cache[`${id}.map`] };
        }
      },
    };
  },
);
