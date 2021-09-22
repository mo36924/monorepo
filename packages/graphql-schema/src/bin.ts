import { readFileSync, watch, writeFileSync } from "fs";
import { printBuildSchemaModel } from "./index";

const [model, schema] = process.argv.slice(2);

if (!model || !schema) {
  throw new Error("Invalid argument.");
}

function generateSchema() {
  writeFileSync(schema, printBuildSchemaModel(readFileSync(model, "utf8")));
}

if (process.env.NODE_ENV === "production") {
  generateSchema();
} else {
  watch(model, generateSchema);
}
