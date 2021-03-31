import { readFile } from "fs/promises";
import { parse } from "graphql";
import cache from "./cache";

export default async () => async (path: string) => {
  if (!/\.(gql|graphql)$/.test(path)) {
    return;
  }

  let data = cache.graphql[path];

  if (data !== undefined) {
    return data;
  }

  data = await readFile(path, "utf8");
  const documentNode = parse(data, { noLocation: true });
  const documentNodeJson = JSON.stringify({ ...documentNode, path });

  const documentNodeString = documentNodeJson.includes("'")
    ? JSON.stringify(documentNodeJson)
    : `'${documentNodeJson}'`;

  data = `export default JSON.parse(${documentNodeString});`;
  cache.graphql[path] = data;
  return data;
};
