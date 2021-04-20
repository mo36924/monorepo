import { readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import type { Config } from "@mo36924/config";
import { schema, typescript } from "@mo36924/graphql-schema";

const _require = createRequire(import.meta.url);

export const graphqlDeclarationPath = _require.resolve("@mo36924/types/graphql.d.ts");

export default async (config: Config) => {
  const graphqlModel = await readFile(config.graphql, "utf8");
  const declaration = await typescript(schema(graphqlModel));
  await writeFile(graphqlDeclarationPath, declaration);
};
