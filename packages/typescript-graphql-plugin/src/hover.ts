import { isGraphqlTag } from "@mo36924/typescript-graphql";
import type { default as typescript, SourceFile, TaggedTemplateExpression } from "typescript";

export const hover = (ts: typeof typescript, sourceFile: SourceFile, position: number) => {
  const tag = ts.forEachChild(sourceFile, function visitor(node): true | undefined | TaggedTemplateExpression {
    if (position < node.pos) {
      return true;
    }

    if (position >= node.end) {
      return;
    }

    if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && isGraphqlTag(node.tag.text)) {
      const template = node.template;

      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        if (position >= template.getStart() + 1 && position < template.getEnd() - 1) {
          return node;
        }
      } else {
        const head = template.head;

        if (position >= head.getStart() + 1 && position < head.getEnd() - 2) {
          return node;
        }

        for (const { literal } of template.templateSpans) {
          if (
            position >= literal.getStart() + 1 &&
            position < literal.getEnd() - (ts.isTemplateMiddle(literal) ? 2 : 1)
          ) {
            return node;
          }
        }
      }
    }

    return ts.forEachChild(node, visitor);
  });

  if (tag === true) {
    return;
  }

  return tag;
};
