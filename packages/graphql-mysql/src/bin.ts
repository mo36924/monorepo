import { readFileSync, watch, writeFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { buildSchemaModel } from "@mo36924/graphql-schema";
import { retry } from "@mo36924/util";
import { cosmiconfigSync } from "cosmiconfig";
import { createSchemaQuery, createTestDataQuery } from "./index";

const result = cosmiconfigSync("graphql-mysql").search();

if (!result) {
  throw new Error("Not found graphql-mysql config.");
}

const { model, schema, test }: { model?: string; schema?: string; test?: string } = result.config ?? {};

if (!model || !schema) {
  throw new Error(
    `Invalid arguments { model: ${JSON.stringify(model)}, schema: ${JSON.stringify(schema)}, test: ${JSON.stringify(
      test,
    )} }.`,
  );
}

if (process.env.NODE_ENV === "production") {
  const modelCode = readFileSync(model, "utf8");
  const graphqlSchema = buildSchemaModel(modelCode);
  const schemaQuery = createSchemaQuery(graphqlSchema);
  writeFileSync(schema, schemaQuery);

  if (test) {
    const testDataQuery = createTestDataQuery(graphqlSchema);
    writeFileSync(test, testDataQuery);
  }
} else {
  const generate = async () => {
    await retry(async () => {
      const modelCode = await readFile(model, "utf8");
      const graphqlSchema = buildSchemaModel(modelCode);
      const schemaQuery = createSchemaQuery(graphqlSchema);
      await writeFile(schema, schemaQuery);

      if (test) {
        const testDataQuery = createTestDataQuery(graphqlSchema);
        await writeFile(test, testDataQuery);
      }
    });
  };

  generate();
  watch(model, generate);
}
