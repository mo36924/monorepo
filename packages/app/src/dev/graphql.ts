import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import type { MiddlewareFactory } from "@mo36924/http-server";
import { parse } from "graphql";
import type { Cache } from "./cache";

export default ({ cache }: { cache: Cache }): MiddlewareFactory => () => async (req, res) => {
  if (req.extname !== ".gql" && req.extname !== ".graphql") {
    return;
  }

  const path = fileURLToPath(new URL(req._url, "file:///"));

  if (path in cache.graphql.script) {
    await res.type("js").send(cache.graphql.script[path]);
    return;
  }

  const data = await readFile(path, "utf8");
  const ast = parse(data, { noLocation: true });
  const json = JSON.stringify({ ...ast, path }, null, 2);
  const value = json.includes("'") ? JSON.stringify(json) : `'${json}'`;
  const result = `export default JSON.parse(${value});`;
  cache.graphql.script[path] = result;
  await res.type("js").send(result);
};
