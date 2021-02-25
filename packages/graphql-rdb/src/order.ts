import type { Context } from "./context";

const camelCaseRegexp = /_./g;
const replacer = (value: string) => value[1].toUpperCase();
const camelCase = (value: string) => value.toLowerCase().replace(camelCaseRegexp, replacer);

export default (context: Context, order: string[] | null | undefined) => {
  if (!order) {
    return "";
  }

  return order
    .map((order) => {
      const matches = order.match(/^(.*?)_(ASC|DESC)$/)!;
      return `${context.escapeId(camelCase(matches[1]))} ${matches[2]}`;
    })
    .join();
};
