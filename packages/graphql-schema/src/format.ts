import prettier from "@mo36924/prettier";
import { stripIgnoredCharacters } from "graphql";

export const minify = (code: string) => {
  return stripIgnoredCharacters(code);
};

export const format = (code: string, filepath: string = "index.gql") => {
  const prettierConfig = prettier.resolveConfig.sync(filepath);
  return prettier.format(minify(code), { ...prettierConfig, filepath });
};
