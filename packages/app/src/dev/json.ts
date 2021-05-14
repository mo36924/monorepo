import { readFile } from "fs/promises";
import type { MiddlewareFactory } from "@mo36924/http-server";
import reserved from "reserved-words";
import ts from "typescript";
import { formatDiagnosticsHost } from "../util";
import type { Cache } from "./cache";

export default ({ cache }: { cache: Cache }): MiddlewareFactory => () => async ({ path, extname }, res) => {
  if (!path || extname !== ".json") {
    return;
  }

  let json = cache.json.script[path];

  if (json == null) {
    const data = await readFile(path, "utf8");

    const diagnostics: ts.Diagnostic[] = [];
    const obj = ts.convertToObject(ts.parseJsonText(path, data), diagnostics);

    if (diagnostics.length) {
      json = `throw new SyntaxError(${JSON.stringify(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, formatDiagnosticsHost),
      )});`;
    } else if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      json = `${Object.entries<any>(obj)
        .filter(([key]) => /^[A-Za-z_$][A-Za-z_$0-9]*$/.test(key) && !reserved.check(key, 6, true))
        .map(([key, value]) => `export const ${key} = ${JSON.stringify(value, null, 2)};\n`)
        .join("")}export default ${JSON.stringify(obj, null, 2)};`;
    } else {
      json = `export default ${JSON.stringify(obj, null, 2)};`;
    }

    cache.json.script[path] = json;
  }

  await res.type("js").send(json);
};
