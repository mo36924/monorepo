import type { PartialConfig } from "@mo36924/config";
import program, { Command } from "commander";
import index from "./index";

program.action(bin);
program.command("build").description("Build project.").action(bin);
program.parse();

async function bin(partialConfig: PartialConfig, command: Command) {
  try {
    const name = command.name();
    const watch = name !== "build";
    await index({ ...partialConfig, watch });
  } catch (err) {
    process.exitCode = 1;
    console.error(String(err));
  }
}
