import { cosmiconfig } from "cosmiconfig";
import routeGenerator from "./index";

async function main() {
  const result = await cosmiconfig("route").search();

  try {
    await routeGenerator(result?.config);
  } catch (err) {
    process.exitCode = 1;
    console.log(err);
  }
}

main();
