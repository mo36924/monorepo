import { readFile, writeFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import { schema, typescript } from "@mo36924/graphql-schema";
import { factory } from "@mo36924/typescript-graphql";
import watchData from "@mo36924/watch-data";
import { buildSchema } from "graphql";
import ts from "typescript";
import { graphqlDeclarationPath } from "../build/graphql-typescript";

export default async (config: Config) => {
  let taggedTemplateExpressionHook: ts.TaggedTemplateExpressionHook = () => {};

  ts.taggedTemplateExpressionHooks.push((ts, node, checker) => taggedTemplateExpressionHook(ts, node, checker));

  const pacth = async (graphqlModel: string) => {
    const graphqlSource = schema(graphqlModel);
    const graphqlSchema = buildSchema(graphqlSource);
    const declaration = await typescript(graphqlSource);
    await writeFile(graphqlDeclarationPath, declaration);
    taggedTemplateExpressionHook = factory(graphqlSchema);
  };

  try {
    const graphqlModel = await readFile(config.graphql, "utf8");
    await pacth(graphqlModel);
  } catch {}

  watchData(config.graphql, async (graphqlModel) => {
    try {
      await pacth(graphqlModel);
    } catch {}
  });
};
