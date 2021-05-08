import program from "commander";
import index from "./index";

const options = program.option("-w, --watch", "Watch project.").parse().opts();
index(options).catch(() => {});
