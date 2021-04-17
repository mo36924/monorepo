import type { Typescript } from "@mo36924/typescript-patch";
import { taggedTemplateExpressionHook } from "./tagged-template-expression-hook";

export const patch = (ts: Typescript) => {
  const taggedTemplateExpressionHooks = ts.taggedTemplateExpressionHooks;

  if (taggedTemplateExpressionHooks && !taggedTemplateExpressionHooks.includes(taggedTemplateExpressionHook)) {
    taggedTemplateExpressionHooks.push(taggedTemplateExpressionHook);
  }
};
