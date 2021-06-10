import { readFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import { fixSchema } from "@mo36924/graphql-schema";
import watchData from "@mo36924/watch-data";

export default async (config: Config) => {
  const watch = config.watch;

  let database = async (_schema: string) => {};

  if (watch) {
    const mod = await import("./dev/database");
    database = await mod.default(config);
  }

  const pacth = async (graphqlModel: string) => {
    try {
      const graphqlSchemaSource = fixSchema(graphqlModel);
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
