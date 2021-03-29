import { escapeId } from "@mo36924/postgres-escape";
import type { Context } from "./context";

const camelCaseRegexp = /_./g;
const replacer = (value: string) => value[1].toUpperCase();
const camelCase = (value: string) => value.toLowerCase().replace(camelCaseRegexp, replacer);
const noCaseRegexp = /_/g;
const noCase = (value: string) => value.toLowerCase().replace(noCaseRegexp, " ");

export default (_context: Context, order: string[] | null | undefined) => {
  if (!order) {
    return "";
  }

  return order
    .map((order) => {
      const matches = order.match(
        /^(.*?)_(ASC|DESC|ASC_NULLS_FIRST|ASC_NULLS_LAST|DESC_NULLS_FIRST|DESC_NULLS_LAST)$/,
      )!;

      return `${escapeId(camelCase(matches[1]))} ${noCase(matches[2])}`;
    })
    .join();
};
