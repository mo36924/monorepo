import { resolve } from "path";
import type { Config } from "@mo36924/config";
import { memoize } from "@mo36924/memoize";
import { format, resolveConfig } from "@mo36924/prettier";
import type { Plugin } from "rollup";
import ts from "typescript";

export default memoize(
  (config: Config): Plugin => {
    const tsconfigPath = resolve(config.rootDir, "tsconfig.json");
    const prettierConfig = resolveConfig.sync(tsconfigPath);

    const tsconfigJson = format(
      `{
      "compilerOptions": {
        "target": "ES2020",
        "module": "ES2020",
        "moduleResolution": "Node",
        "resolveJsonModule": true,
        "jsx": "preserve",
        "jsxImportSource": "react",
        "importsNotUsedAsValues": "error",
        "baseUrl": ".",
        "paths": {
          "~/*": ["./*"]
        },
        "strict": true,
        "esModuleInterop": true,
        "noEmitOnError": true,
        "importHelpers": true,
        "sourceMap": true,
        "inlineSourceMap": false,
        "inlineSources": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "plugins": [{ "name": "@mo36924/typescript-graphql-plugin" }]
      },
      "exclude": ["dist"]
    }`,
      { ...prettierConfig, filepath: tsconfigPath },
    );

    ts.sys.writeFile(tsconfigPath, tsconfigJson);

    const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
      getCurrentDirectory: () => config.rootDir,
      getCanonicalFileName: (fileName) => fileName,
      getNewLine: () => ts.sys.newLine,
    };

    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const { options, fileNames, errors } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, config.rootDir);
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
