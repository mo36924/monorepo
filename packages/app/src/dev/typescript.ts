import { resolve } from "path";
import ts from "typescript";
import { formatDiagnosticsHost } from "../util";
import cache from "./cache";

export default async () => {
  const tsconfigPath = resolve("tsconfig.json");
  const tsBuildInfoPath = resolve("tsconfig.tsbuildinfo");

  const host = ts.createWatchCompilerHost(
    tsconfigPath,
    { incremental: true, tsBuildInfoFile: tsBuildInfoPath, sourceMap: false, inlineSourceMap: true },
    {
      ...ts.sys,
      readFile(path, encoding) {
        if (path === tsBuildInfoPath) {
          return cache.raw.tsBuildInfo;
        }

        return ts.sys.readFile(path, encoding);
      },
      writeFile(path, data) {
        if (path === tsBuildInfoPath) {
          cache.raw.tsBuildInfo = data;
          return;
        }

        path = path.replace(/\.js(x)?$/, ".ts$1");
        cache.typescript[path] = data;
        cache.server[path] = cache.client[path] = undefined;
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
};
