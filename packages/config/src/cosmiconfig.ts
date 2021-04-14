import { dirname } from "path";
import { fileURLToPath } from "url";
import { cosmiconfigSync } from "cosmiconfig";

const path = dirname(fileURLToPath(import.meta.url));
const result = cosmiconfigSync("app").search(path);
const config = { ...result?.config, cwd: result?.filepath ? dirname(result.filepath) : process.cwd() };

export default config;
