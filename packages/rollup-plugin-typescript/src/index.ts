import type { Plugin } from "rollup";
import ts, { CompilerOptions } from "typescript";

export default (compilerOptions: CompilerOptions): Plugin => {
  compilerOptions = {
    ...compilerOptions,
    jsx: ts.JsxEmit.Preserve,
    jsxImportSource: "react",
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
    allowJs: true,
    importHelpers: true,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  };

  const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => ts.sys.newLine,
  };

  return {
    name: "typescript-transpile-module",
    transform(code, id) {
      const { diagnostics, outputText, sourceMapText } = ts.transpileModule(code, {
        compilerOptions,
        fileName: id,
        reportDiagnostics: true,
      });

      if (diagnostics?.length) {
        const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, formatDiagnosticsHost);
        this.warn(message);
      }

      return { code: outputText, map: sourceMapText };
    },
  };
};
