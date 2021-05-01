import { readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";
import type { Config } from "@mo36924/config";
import { schema, typescript } from "@mo36924/graphql-schema";
import { factory } from "@mo36924/typescript-graphql";
import watchData from "@mo36924/watch-data";
import { buildSchema } from "graphql";
import ts from "typescript";

export default async (config: Config) => {
  const _require = createRequire(import.meta.url);
  const graphqlDeclarationPath = join(_require.resolve("@mo36924/types"), "..", "..", "graphql.d.ts");

  let taggedTemplateExpressionHook: ts.TaggedTemplateExpressionHook = () => {};

  ts.taggedTemplateExpressionHooks.push((ts, node, checker) => taggedTemplateExpressionHook(ts, node, checker));

  const pacth = async (graphqlModel: string) => {
    try {
      const graphqlSource = schema(graphqlModel);
      const graphqlSchema = buildSchema(graphqlSource);
      const declaration = await typescript(graphqlSource);
      await writeFile(graphqlDeclarationPath, declaration);
      taggedTemplateExpressionHook = factory(graphqlSchema);
    } catch {}
  };

  try {
    const graphqlModel = await readFile(config.graphql, "utf8");
    await pacth(graphqlModel);
  } catch {}

  if (!config.watch) {
    return;
  }

  watchData(config.graphql, async (graphqlModel) => {
    await pacth(graphqlModel);
  });
};
