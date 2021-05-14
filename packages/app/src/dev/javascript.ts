import { readFile } from "fs/promises";
import { resolve } from "path";
import { transformAsync } from "@babel/core";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";
import type { MiddlewareFactory } from "@mo36924/http-server";
import ts from "typescript";
import { formatDiagnosticsHost } from "../util";
import type { Cache } from "./cache";

const extensions = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"];

type Options = { cache: Cache } & Pick<Config, "inject">;

export default ({ cache, inject }: Options): MiddlewareFactory => () => {
  const tsconfigPath = resolve("tsconfig.json");
  const tsBuildInfoPath = resolve("tsconfig.tsbuildinfo");

  const host = ts.createWatchCompilerHost(
    tsconfigPath,
    { incremental: true, tsBuildInfoFile: tsBuildInfoPath, sourceMap: false, inlineSourceMap: true },
    {
      ...ts.sys,
      readFile(path, encoding) {
        if (path === tsBuildInfoPath) {
          return cache.typescript[tsBuildInfoPath];
        }

        return ts.sys.readFile(path, encoding);
      },
      writeFile(path, data) {
        if (path === tsBuildInfoPath) {
          cache.typescript[tsBuildInfoPath] = data;
          return;
        }

        path = path.replace(/\.js(x)?$/, ".ts$1");
        cache.typescript[path] = data;
      },
    },
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    (diagnostic) => ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost)),
    (diagnostic, _newLine, _options, errorCount) => {
      ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));
      process.exitCode = errorCount || 1;
    },
  );

  const program = ts.createWatchProgram(host);

  process.on("exit", () => {
    try {
      program.close();
    } catch {}
  });

  return async ({ path, extname, userAgent }, res) => {
    if (!path || !extensions.includes(extname)) {
      return;
    }

    const isClient = !!userAgent;
    const target = isClient ? "client" : "server";
    const javascriptCache = cache.javascript[target];
    let javascript = javascriptCache[path];

    if (javascript == null) {
      const data = cache.typescript[path] ?? (await readFile(path, "utf8"));

      const result = await transformAsync(data, {
        filename: path,
        configFile: false,
        babelrc: false,
        compact: false,
        sourceMaps: true,
        presets: [[app, { target, env: "development", inject } as AppOptions]],
      });

      let code = result!.code!;
      const map = result!.map!;

      if (!map.sourcesContent) {
        map.sourcesContent = await Promise.all(
          map.sources.map((source) => readFile(resolve(path, "..", source), "utf8")),
        );
      }

      code += `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map), "utf8").toString(
        "base64",
      )}`;

      javascript = javascriptCache[path] = code;
    }

    await res.type("js").send(javascript);
  };
};
