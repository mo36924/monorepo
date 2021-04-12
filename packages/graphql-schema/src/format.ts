import { parse, print, stripIgnoredCharacters } from "graphql";
import prettier from "prettier";

export const format = async (code: string, filepath: string) => {
  const prettierConfig = await prettier.resolveConfig(filepath);
  return prettier.format(print(parse(stripIgnoredCharacters(code))), { ...prettierConfig, filepath });
};
