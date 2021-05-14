import { join, resolve } from "path";
import type { Plugin } from "rollup";
import ts from "typescript";
import { formatDiagnosticsHost } from "../../util";

const cwd = process.cwd();
const cache: { [path: string]: string } = Object.create(null);
let init = true;

export default (): Plugin => {
  return {
    name: "typescript",
    buildStart() {
      if (!init) {
        return;
      }

      init = false;
      const tsconfigPath = resolve("tsconfig.json");
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      const { options, fileNames, errors } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd);

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
    },
    async resolveId(source, importer, options) {
      if (source.startsWith("~/")) {
        source = join(cwd, source.slice(2));
        const resolvedId = await this.resolve(source, importer, { ...options, skipSelf: true });
        return resolvedId;
      }
    },
    load(id) {
      if (id in cache && `${id}.map` in cache) {
        return { code: cache[id], map: cache[`${id}.map`] };
      }
    },
  };
};
