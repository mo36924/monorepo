import { readFileSync, watch, writeFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { retry } from "@mo36924/util";
import { printBuildSchemaModel } from "./index";

const [model, schema] = process.argv.slice(2);

if (!model || !schema) {
  throw new Error("Invalid argument.");
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
