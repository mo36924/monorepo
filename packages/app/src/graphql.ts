import { readFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import { schema, typescript } from "@mo36924/graphql-schema";
import { factory } from "@mo36924/typescript-graphql";
import watchData from "@mo36924/watch-data";
import { buildSchema } from "graphql";
import ts from "typescript";
import { writeWithFormat } from "./util";

export default async (config: Config) => {
  const watch = config.watch;

  let database = async (_schema: string) => {};

  if (watch) {
    const mod = await import("./dev/database");
    database = await mod.default(config);
  }

  let taggedTemplateExpressionHook: ts.TaggedTemplateExpressionHook = () => {};

  ts.taggedTemplateExpressionHooks.push((ts, node, checker) => taggedTemplateExpressionHook(ts, node, checker));

  const pacth = async (graphqlModel: string) => {
    try {
      const graphqlSchemaSource = schema(graphqlModel);
      const graphqlSchema = buildSchema(graphqlSchemaSource);
      const declaration = await typescript(graphqlSchemaSource);
      await writeWithFormat("types/graphql.d.ts", declaration);
      taggedTemplateExpressionHook = factory(graphqlSchema);
      await database(graphqlSchemaSource);
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
