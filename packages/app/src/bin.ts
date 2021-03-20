import { readFile } from "fs/promises";
import { basename, extname, resolve } from "path";
import { pathToFileURL } from "url";
import program from "commander";
import app from "./index";

const pkg = "package.json";

const options = program
  .option("-p, --project <file>", "Compile the project given the path to its configuration file.", pkg)
  .parse()
  .opts();

(async () => {
  const project = options.project;
  const ext = extname(project);
  let config: any;

  if (basename(project) === pkg) {
    const json = await readFile(resolve(project), "utf8");
    config = JSON.parse(json);
  } else if (ext === ".json") {
    const json = await readFile(resolve(project), "utf8");
    config = JSON.parse(json);
  } else {
    const mod = await import(pathToFileURL(project).href);
    config = mod.default;
  }

  await app(config);
})().catch((err) => {
  process.exitCode = 1;
  console.error(String(err));
});
