import { readFile, writeFile } from "fs/promises";
import { version } from "graphql";

export default async () => {
  if (!version.startsWith("16.")) {
    return;
  }

  const path = "node_modules/graphql/package.json";
  const graphql = JSON.parse(await readFile(path, "utf8"));

  graphql.exports = {
    ".": {
      import: "./index.mjs",
      require: "./index.js",
    },
    "./*": {
      import: "./*.mjs",
      require: "./*.js",
    },
  };

  await writeFile(path, JSON.stringify(graphql, null, 2));
};
