import { dirname } from "path";
import ts from "typescript";

type Options = {
  filepath?: string;
};

export default (text: string, options: Options = {}) => {
  const filepath = ts.sys.resolvePath(options.filepath ?? "index.tsx");
  const tsconfig = ts.findConfigFile(filepath, ts.sys.fileExists);

  const compilerOptions: ts.CompilerOptions = {
    ...(tsconfig
      ? ts.parseJsonConfigFileContent(ts.readConfigFile(tsconfig, ts.sys.readFile).config, ts.sys, dirname(tsconfig))
          .options
      : ts.getDefaultCompilerOptions()),
    allowJs: true,
  };

  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [filepath],
    getScriptVersion: () => "0",
    getScriptSnapshot: () => ts.ScriptSnapshot.fromString(text),
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };

  const languageService = ts.createLanguageService(servicesHost);
  const fileChanges = languageService.organizeImports({ type: "file", fileName: filepath }, {}, {})[0];
  const textChanges = fileChanges?.textChanges ?? [];
  return textChanges.reduceRight((text, change) => {
    const head = text.slice(0, change.span.start);
    const tail = text.slice(change.span.start + change.span.length);
    return `${head}${change.newText}${tail}`;
  }, text);
};
