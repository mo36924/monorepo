import { readFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import { schema, typescript } from "@mo36924/graphql-schema";
import { factory } from "@mo36924/typescript-graphql";
import watchData from "@mo36924/watch-data";
import { buildSchema } from "graphql";
import ts from "typescript";
import database from "./database";
import { writeWithFormat } from "./util";

export default async (config: Config) => {
  const watch = config.watch;
  const resetDatabase = await database(config);

  let taggedTemplateExpressionHook: ts.TaggedTemplateExpressionHook = () => {};

  ts.taggedTemplateExpressionHooks.push((ts, node, checker) => taggedTemplateExpressionHook(ts, node, checker));

  const pacth = async (graphqlModel: string) => {
    try {
      const graphqlSchemaSource = schema(graphqlModel);
      const graphqlSchema = buildSchema(graphqlSchemaSource);
      const declaration = await typescript(graphqlSchemaSource);
      await writeWithFormat("types/graphql.d.ts", declaration);
      taggedTemplateExpressionHook = factory(graphqlSchema);
      await resetDatabase(graphqlSchemaSource);
    } catch {}
  };

  try {
    const graphqlModel = await readFile(config.graphql, "utf8");
    await pacth(graphqlModel);
  } catch {}

  if (!watch) {
    return;
  }

  watchData(config.graphql, async (graphqlModel) => {
    await pacth(graphqlModel);
  });
};
