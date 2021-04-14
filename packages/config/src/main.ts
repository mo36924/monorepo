import { basename, dirname } from "path";
import cosmiconfig from "./cosmiconfig";
import database from "./database";
import extensions from "./extensions";
import inject from "./inject";
import normalize from "./normalize";
import pkg from "./package";
import page from "./page";
import path from "./path";
import resolve from "./resolve";

export const watch = process.env.NODE_ENV !== "production";
export const client = resolve.client("lib") ?? "./lib/index.client.ts";
export const server = resolve.server("lib") ?? "./lib/index.ts";
export const main = pkg.main ?? "./dist/index.js";
export const dir = dirname(main);
export const base = basename(main);
export const favicon = normalize(cosmiconfig.favicon ?? "./lib/favicon.ico");
export const css = normalize(cosmiconfig.css ?? "./lib/index.css");
export const module = normalize(cosmiconfig.module ?? client);
export const nomodule = normalize(cosmiconfig.nomodule ?? client);
export const graphql = path(cosmiconfig.graphql ?? "./lib/index.gql");
export const cwd = cosmiconfig.cwd;
export { database, extensions, inject, page };
