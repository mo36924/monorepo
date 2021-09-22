import { watch } from "fs";
import { readFile, writeFile } from "fs/promises";
import { printBuildSchemaModel } from "./index";

const [model, schema] = process.argv.slice(2);

if (!model || !schema) {
  throw new Error("Invalid argument.");
}

async function generate() {
  await writeFile(schema, printBuildSchemaModel(await readFile(model, "utf8")));
}

if (process.env.NODE_ENV === "production") {
  generate();
} else {
  const _generate = () => generate().catch(console.error);
  _generate();
  watch(model, _generate);
}
