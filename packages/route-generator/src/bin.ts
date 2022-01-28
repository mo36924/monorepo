#!/usr/bin/env node
import { cosmiconfig } from "cosmiconfig";
import routeGenerator from "./index";

async function main() {
  const result = await cosmiconfig("route-generator").search();
  const config = result?.config;

  try {
    if (Array.isArray(config)) {
      await Promise.all(config.map(routeGenerator));
    } else {
      await routeGenerator(config);
    }
  } catch (err) {
    process.exitCode = 1;
    console.log(err);
  }
}

main();
