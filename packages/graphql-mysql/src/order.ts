import { camelCase, noCase } from "change-case";
import { escapeId } from "./util";

export const createOrderClause = (order: string[] | null | undefined) => {
  if (order?.length) {
    return `order by ${order
      .map((order: string) =>
        order.replace(
          /^(.*?)_(ASC|DESC|ASC_NULLS_FIRST|ASC_NULLS_LAST|DESC_NULLS_FIRST|DESC_NULLS_LAST)$/,
          (_m, p1: string, p2: string) => `${escapeId(camelCase(p1))} ${noCase(p2)}`,
        ),
      )
      .join()}`;
  }

  return "";
};
