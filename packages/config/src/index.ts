import { basename, dirname } from "path";
import cosmiconfig from "./cosmiconfig";
import extensions from "./extensions";
import normalize from "./normalize";
import pkg from "./package";
import resolve from "./resolve";

export const client = resolve.client("lib") ?? "./lib/index.client.ts";
export const server = resolve.server("lib") ?? "./lib/index.ts";
export const main = pkg.main ?? "./dist/index.js";
export const dir = dirname(main);
export const base = basename(main);
export const favicon = normalize(cosmiconfig.favicon ?? "./lib/favicon.ico");
export const css = normalize(cosmiconfig.css ?? "./lib/index.css");
export const module = normalize(cosmiconfig.module ?? client);
export const nomodule = normalize(cosmiconfig.nomodule ?? client);
export { extensions };
