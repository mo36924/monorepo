import { watch } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { printBuildSchemaModel } from "@mo36924/graphql-schema";
import { format } from "@mo36924/graphql-utilities";

export type Options = {
  watch?: boolean;
  model?: string;
  schema?: string;
};

const defaultOptions: Required<Options> = {
  watch: process.env.NODE_ENV === "development",
  model: "graphql/model.gql",
  schema: "graphql/schema.gql",
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
  const {
    watch: watchMode,
    model: modelPath,
    schema: schemaPath,
  } = {
    ...defaultOptions,
    ...options,
  };

  await Promise.all([mkdir(dirname(modelPath), { recursive: true }), mkdir(dirname(schemaPath), { recursive: true })]);
  const defaultModel = format(`type User { name: String! }`, modelPath);

  try {
    await writeFile(modelPath, defaultModel, { flag: "wx" });
  } catch {}

  if (watchMode) {
    try {
      await generate();
    } catch {}

    watch(modelPath, async () => {
      try {
        await generate();
      } catch {}
    });
  } else {
    await generate();
  }

  async function generate() {
    const model = await readFile(modelPath, "utf8");
    const schema = printBuildSchemaModel(model);
    await writeFileAsync(schemaPath, schema);
  }
};
