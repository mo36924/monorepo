import { constants, copyFileSync, readFileSync, writeFileSync } from "fs";

export default () => {
  const src = new URL("../../../prettier/index.js", import.meta.url);
  const dest = new URL("_", src);

  try {
    copyFileSync(src, dest, constants.COPYFILE_EXCL);
  } catch {}

  let data = readFileSync(dest, "utf8");

  for (const fn of [replaceIsHtml, replaceIsGraphQL, replaceDocGraphQL, replaceFormatGraphQL]) {
    const _data = data;
    data = fn(_data);

    if (_data === data) {
      throw new Error("Not found search value.");
    }
  }

  writeFileSync(src, data);
};

const replaceIsHtml = (code: string) =>
  code.replace(
    /function isHtml[\s\S]*?}/,
    () => `
function isHtml(path) {
  return (
    hasLanguageComment(path.getValue(), "HTML") ||
    path.match(
      (node) => node.type === "TemplateLiteral",
      (node, name) =>
        node.type === "TaggedTemplateExpression" &&
        node.tag.type === "Identifier" &&
        node.tag.name === "html" &&
        name === "quasi",
    ) ||
    path.match(
      (node) => node.type === "TemplateLiteral",
      (node, name) =>
        node.type === "TaggedTemplateExpression" &&
        node.tag.type === "MemberExpression" &&
        node.tag.property.type === "Identifier" &&
        node.tag.property.name === "html" &&
        name === "quasi",
    )
  );
}
`,
  );

const replaceIsGraphQL = (code: string) =>
  code.replace(
    /function isGraphQL[\s\S]*?}/,
    () => `
function isGraphQL(path) {
  const node = path.getValue();
  const parent = path.getParentNode();
  return (
    hasLanguageComment(node, "GraphQL") ||
    (parent &&
      ((parent.type === "TaggedTemplateExpression" &&
        ((parent.tag.type === "MemberExpression" &&
          parent.tag.object.name === "graphql" &&
          parent.tag.property.name === "experimental") ||
          (parent.tag.type === "Identifier" &&
            (parent.tag.name === "gql" ||
              parent.tag.name === "graphql" ||
              parent.tag.name === "query" ||
              parent.tag.name === "mutation" ||
              parent.tag.name === "subscription" ||
              parent.tag.name === "useQuery" ||
              parent.tag.name === "useMutation" ||
              parent.tag.name === "useSubscription")))) ||
        (parent.type === "CallExpression" && parent.callee.type === "Identifier" && parent.callee.name === "graphql")))
  );
}
`,
  );

const replaceDocGraphQL = (code: string) =>
  code.replace(/indent,\s+join,\s+hardline/, "indent,join,hardline,softline},utils:{mapDoc,cleanDoc,replaceEndOfLine");

const replaceFormatGraphQL = (code: string) =>
  code.replace(
    "for (let i = 0; i < numQuasis; i++) {",
    (m) => `
const parent = path.getParentNode();
if (
  parent &&
  parent.type === "TaggedTemplateExpression" &&
  parent.tag.type === "Identifier" &&
  (parent.tag.name === "gql" ||
    parent.tag.name === "query" ||
    parent.tag.name === "mutation" ||
    parent.tag.name === "subscription" ||
    parent.tag.name === "useQuery" ||
    parent.tag.name === "useMutation" ||
    parent.tag.name === "useSubscription")
) {
  const text = node.quasis
    .map((quasi) => quasi.value.cooked)
    .reduce((previous, current, i) => \`\${previous}$_\${i - 1}_\${current}\`);
  const doc = textToDoc(text, { parser: "graphql" }, { stripTrailingHardline: true });
  let replaceCounter = 0;
  const newDoc = mapDoc(cleanDoc(doc), (doc) => {
    if (typeof doc !== "string" || !doc.includes("$_")) {
      return doc;
    }
    return doc.split(/\\$_(\\d+)_/).map((component, i) => {
      if (i % 2 === 0) {
        return replaceEndOfLine(component);
      }
      replaceCounter++;
      return expressionDocs[component];
    });
  });
  if (expressionDocs.length !== replaceCounter) {
    throw new Error("Couldn't insert all the expressions");
  }
  return ["\`", indent([hardline, newDoc]), softline, "\`"];
}
${m}
`,
  );
