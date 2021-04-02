import { readFile } from "fs/promises";
import { extname } from "path";
import { pathToFileURL } from "url";
import program, { Command } from "commander";
import app, { Options } from "./index";

program.arguments("[source]").action(bin);
program.command("build [source]").description("Build project.").action(bin);
program.parse();

async function bin(source: string = "package.json", options: Options, command: Command) {
  try {
    const name = command.name();
    const watch = name !== "build";

    if (extname(source) === ".json") {
      const json = await readFile(source, "utf8");
      options = { ...JSON.parse(json), ...options, watch };
    } else {
      const mod = await import(pathToFileURL(source).href);
      options = { ...mod.default, ...options, watch };
    }

    await app(options);
  } catch (err) {
    process.exitCode = 1;
    console.error(String(err));
  }
}
