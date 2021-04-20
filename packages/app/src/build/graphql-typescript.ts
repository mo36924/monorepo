import { readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";
import type { Config } from "@mo36924/config";
import { schema, typescript } from "@mo36924/graphql-schema";
import { factory } from "@mo36924/typescript-graphql";
import { buildSchema } from "graphql";
import ts from "typescript";

const _require = createRequire(import.meta.url);

export const graphqlDeclarationPath = join(_require.resolve("@mo36924/types"), "..", "graphql.d.ts");

export default async (config: Config) => {
  let graphqlModel = "";

  try {
    graphqlModel = await readFile(config.graphql, "utf8");
  } catch {
    return;
  }

  const graphqlSource = schema(graphqlModel);
  const graphqlSchema = buildSchema(graphqlSource);
  const declaration = await typescript(graphqlSource);
  await writeFile(graphqlDeclarationPath, declaration);
  const taggedTemplateExpressionHook = factory(graphqlSchema);
  ts.taggedTemplateExpressionHooks.push((ts, node, checker) => taggedTemplateExpressionHook(ts, node, checker));
};
