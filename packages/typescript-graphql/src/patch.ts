import { Checker, hookName } from "@mo36924/typescript-patch";
import type { TaggedTemplateExpression } from "typescript";
import { hook } from "./hook";
import { schema } from "./schema";
import type { typescript } from "./typescript";

export const patch = (ts: typescript) => {
  const _schema = schema();
  (ts as any)[hookName] = (node: TaggedTemplateExpression, checker: Checker) => hook(ts, _schema, node, checker);
};
