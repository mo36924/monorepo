import { stripIgnoredCharacters } from "graphql";
import { format } from "./format";

export const minify = async (code: string, filepath?: string) => {
  const gql = await format(code, filepath);
  return stripIgnoredCharacters(gql);
};
