import { watch } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

export type Options = {
  watch?: boolean;
  name?: string;
  graphql?: string;
  schema?: string;
  data?: string;
};

const defaultOptions: Required<Options> = {
  watch: process.env.NODE_ENV === "development",
  name: "postgres",
  graphql: "graphql/schema.gql",
  schema: "graphql/schema.sql",
  data: "graphql/data.sql",
};

async function writeFileAsync(path: string, data: string) {
  try {
    await writeFile(path, data);
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }
}

export default async (options?: Options) => {
  const { watch: watchMode, name: dbName, graphql, schema: schemaPath } = {
    ...defaultOptions,
    ...options,
  };

  let mod: { data: (schema: string) => string; schema: (schema: string) => string };

  if (dbName === "postgres") {
    mod = await import("@mo36924/graphql-postgres-schema");
  } else {
    throw new Error(`Not support ${dbName}`);
  }

  if (watchMode) {
    try {
      await generate();
    } catch {}

    watch(graphql, async () => {
      try {
        await generate();
      } catch {}
    });
  } else {
    await generate();
  }

  async function generate() {
    const gql = await readFile(graphql, "utf8");
    const schema = mod.schema(gql);
    const data = mod.data(gql);
    await Promise.all([writeFileAsync(schemaPath, schema), writeFileAsync(schemaPath, data)]);
  }
};
