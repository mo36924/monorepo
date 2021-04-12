import program, { Command } from "commander";
import type { Options } from "./main";
import index from "./index";

program.action(bin);
program.command("build").description("Build project.").action(bin);
program.parse();

async function bin(options: Options, command: Command) {
  try {
    const name = command.name();
    const watch = name !== "build";
    await index({ ...options, watch });
  } catch (err) {
    process.exitCode = 1;
    console.error(String(err));
  }
}
