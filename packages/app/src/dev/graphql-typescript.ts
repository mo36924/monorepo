import { writeFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import { schema, typescript } from "@mo36924/graphql-schema";
import watchData from "@mo36924/watch-data";
import graphqlTypescript, { graphqlDeclarationPath } from "../build/graphql-typescript";

export default async (config: Config) => {
  try {
    await graphqlTypescript(config);
  } catch {}

  watchData(config.graphql, async (model) => {
    try {
      const declaration = await typescript(schema(model));
      await writeFile(graphqlDeclarationPath, declaration);
    } catch {}
  });
};
