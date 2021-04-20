import { format as _format, resolveConfig } from "@mo36924/prettier";
import { parse, print, stripIgnoredCharacters } from "graphql";

export const format = async (code: string, filepath: string = "index.gql") => {
  const prettierConfig = await resolveConfig(filepath);
  return _format(print(parse(stripIgnoredCharacters(code))), { ...prettierConfig, filepath });
};
