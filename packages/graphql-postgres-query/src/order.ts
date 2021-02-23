import { escapeIdentifier } from "@mo36924/postgres-escape";
import { camelCase, noCase } from "change-case";

export default (order: string[] | null | undefined, tableId: string) => {
  if (!order) {
    return "";
  }

  return order
    .map((order) => {
      const [, p1, p2] = order.match(
        /^(.*?)_(ASC|DESC|ASC_NULLS_FIRST|ASC_NULLS_LAST|DESC_NULLS_FIRST|DESC_NULLS_LAST)$/,
      )!;

      return `${tableId}.${escapeIdentifier(camelCase(p1))} ${noCase(p2)}`;
    })
    .join();
};
