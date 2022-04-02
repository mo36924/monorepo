import { readFileSync, statSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { buildModel } from "@mo36924/graphql-model";
import { cosmiconfigSync } from "cosmiconfig";

export const loadConfig = () => {
  const cwd = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");
  const result = cosmiconfigSync("graphql").search(cwd);
  const config = result?.config ?? {};
  const baseUrl: string = typeof config.baseUrl === "string" ? config.baseUrl : "/graphql";
  let model: string | undefined = config.model;

  if (typeof model === "string") {
    model = resolve(cwd, model);
  } else {
    model = undefined;

    for (const path of [
      "model.graphql",
      "model.gql",
      "graphql/model.graphql",
      "graphql/model.gql",
      "index.graphql",
      "index.gql",
      "graphql/index.graphql",
      "graphql/index.gql",
    ]) {
      try {
        const absolutePath = resolve(cwd, path);
        const stat = statSync(absolutePath);

        if (stat.isFile()) {
          model = absolutePath;
          break;
        }
      } catch {}
    }
  }

  return { ...result, cwd, baseUrl, model };
};

export const config = () => {
  const result = loadConfig();
  const build = buildModel(readFileSync(result.model!, "utf8"));
  return { ...result, ...build };
};
