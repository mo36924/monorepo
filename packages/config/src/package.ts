import { readFileSync } from "fs";

let pkg: { [key: string]: any } = {};

try {
  const json = readFileSync("package.json", "utf8");
  pkg = JSON.parse(json);
} catch {}

export default pkg;
