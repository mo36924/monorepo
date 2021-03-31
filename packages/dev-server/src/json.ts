import { readFile } from "fs/promises";
import reserved from "reserved-words";
import ts from "typescript";
import cache from "./cache";
import { formatDiagnosticsHost } from "./util";

export default async () => async (path: string) => {
  if (!/\.json$/.test(path)) {
    return;
  }

  let data = cache.json[path];

  if (data !== undefined) {
    return data;
  }

  data = await readFile(path, "utf8");
  const diagnostics: ts.Diagnostic[] = [];
  const obj = ts.convertToObject(ts.parseJsonText(path, data), diagnostics);

  if (diagnostics.length) {
    data = `throw new SyntaxError(${JSON.stringify(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, formatDiagnosticsHost),
    )});`;
  } else if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    data = `${Object.entries<any>(obj)
      .filter(([key]) => /^[A-Za-z_$][A-Za-z_$0-9]*$/.test(key) && !reserved.check(key, 6, true))
      .map(([key, value]) => `export const ${key} = ${JSON.stringify(value, null, 2)};\n`)
      .join("")}export default ${JSON.stringify(obj, null, 2)};`;
  } else {
    data = `export default ${JSON.stringify(obj, null, 2)};`;
  }

  cache.json[path] = data;
  return data;
};
