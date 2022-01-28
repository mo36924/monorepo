#!/usr/bin/env node
import { readFileSync, watch, writeFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { retry } from "@mo36924/util";
import { cosmiconfigSync } from "cosmiconfig";
import { printBuildSchemaModel } from "./index";

let [model, schema] = process.argv.slice(2);

if (!model || !schema) {
  const config = cosmiconfigSync("graphql-schema").search()?.config ?? {};
  model = config.model;
  schema = config.schema;
}

if (!model || !schema) {
  throw new Error("Not found graphql-schema config.");
}

if (process.env.NODE_ENV === "production") {
  writeFileSync(schema, printBuildSchemaModel(readFileSync(model, "utf8")));
} else {
  const generate = async () => {
    await retry(async () => {
      await writeFile(schema, printBuildSchemaModel(await readFile(model, "utf8")));
    });
  };

  generate();
  watch(model, generate);
}
