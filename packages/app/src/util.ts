import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { format, resolveConfig } from "@mo36924/prettier";
import ts from "typescript";

export const read = async (path: string) => {
  try {
    const data = await readFile(path, "utf8");
    return data;
  } catch {}
};

export const write = async (path: string, data: string) => {
  try {
    await mkdir(dirname(path));
    await writeFile(path, data);
  } catch {}
};

export const writeWithFormat = async (path: string, data: string) => {
  try {
    const config = await resolveConfig(path);
    const _data = format(data, { ...config, filepath: path });
    await write(path, _data);
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