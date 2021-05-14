import { readFile } from "fs/promises";
import type { MiddlewareFactory } from "@mo36924/http-server";
import { parse } from "graphql";
import type { Cache } from "./cache";

export default ({ cache }: { cache: Cache }): MiddlewareFactory => () => async ({ path, extname }, res) => {
  if (!path || (extname !== ".gql" && extname !== ".graphql")) {
    return;
  }

  let graphql = cache.graphql.script[path];

  if (graphql == null) {
    const data = await readFile(path, "utf8");
    const ast = parse(data, { noLocation: true });
    const json = JSON.stringify({ ...ast, path }, null, 2);
    const value = json.includes("'") ? JSON.stringify(json) : `'${json}'`;
    graphql = cache.graphql.script[path] = `export default JSON.parse(${value});`;
  }

  await res.type("js").send(graphql);
};
