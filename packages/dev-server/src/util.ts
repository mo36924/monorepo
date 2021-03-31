import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
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

export const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getCanonicalFileName: (fileName) => fileName,
  getNewLine: () => ts.sys.newLine,
};
