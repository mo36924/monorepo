import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import eslintLintText from "@mo36924/eslint-lint-text";
import organizeImports from "@mo36924/organize-imports";
import { format, resolveConfig } from "@mo36924/prettier";
import ts from "typescript";

export { batchWarnings, handleError } from "rollup/dist/shared/loadConfigFile.js";

export const read = async (path: string) => {
  try {
    const data = await readFile(path, "utf8");
    return data;
  } catch {}
};

export const write = async (path: string, data: string) => {
  try {
    await writeFile(path, data);
  } catch {
    try {
      await mkdir(dirname(path));
      await writeFile(path, data);
    } catch {}
  }
};

export const writeWithFormat = async (path: string, data: string) => {
  try {
    path = resolve(path);

    if (/\.(ts|tsx|js|jsx|mjs)$/.test(path)) {
      data = organizeImports(data, path);
      data = await eslintLintText(data, path);
    }

    const config = await resolveConfig(path);
    data = format(data, { ...config, filepath: path });
    await write(path, data);
  } catch {}
};

export const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getCanonicalFileName: (fileName) => fileName,
  getNewLine: () => ts.sys.newLine,
};

export const memoize = (
  fn: (path: string) => Promise<string | undefined>,
  cache: { [path: string]: string | undefined } = Object.create(null),
) => async (path: string) => (cache[path] ??= await fn(path));
