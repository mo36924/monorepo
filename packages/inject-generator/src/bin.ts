import program from "commander";
import inject from "./index";

const path = program.parse().args[0];
inject({ path }).catch(console.error);
