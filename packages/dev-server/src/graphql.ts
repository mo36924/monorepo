import { readFile } from "fs/promises";
import { parse } from "graphql";

export default async () => async (path: string) => {
  if (!/\.(gql|graphql)$/.test(path)) {
    return;
  }

  let data = await readFile(path, "utf8");
  const documentNode = parse(data, { noLocation: true });
  const documentNodeJson = JSON.stringify({ ...documentNode, path });

  const documentNodeString = documentNodeJson.includes("'")
    ? JSON.stringify(documentNodeJson)
    : `'${documentNodeJson}'`;

  data = `export default JSON.parse(${documentNodeString});`;
  return data;
};
