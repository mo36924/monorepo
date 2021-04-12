import { existsSync, readFileSync, writeFileSync } from "fs";

const patch = "node_modules/typescript/lib/patch";

if (!existsSync(patch)) {
  const checker = `
        var checker = {
`;

  const replaceChecker = `
        var checker = {
            createTupleType: createTupleType,
            getLiteralType: getLiteralType,
            getIntersectionType: getIntersectionType,
            createSyntheticExpression: createSyntheticExpression,
            getGlobalType: getGlobalType,
            createSymbolTable: ts.createSymbolTable,
            emptyArray: ts.emptyArray,
`;

  const getEffectiveCallArguments1 = `
        function getEffectiveCallArguments(node) {
            if (node.kind === 205) {
`;

  const getEffectiveCallArguments2 = `
        function getEffectiveCallArguments(node) {
            if (node.kind === 205 /* TaggedTemplateExpression */) {
`;

  const replaceGetEffectiveCallArguments = `
        function getEffectiveCallArguments(node) {
            if (node.kind === 205 /* TaggedTemplateExpression */) {
                if(ts.taggedTemplateExpressionHook){
                    var args = ts.taggedTemplateExpressionHook(node, checker);
                    if(args){
                        return args;
                    }
                }
`;

  const files = [
    "node_modules/typescript/lib/tsc.js",
    "node_modules/typescript/lib/tsserver.js",
    "node_modules/typescript/lib/tsserverlibrary.js",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/typescript/lib/typescriptServices.js",
    "node_modules/typescript/lib/typingsInstaller.js",
  ];

  for (const file of files) {
    const code = readFileSync(file, "utf-8")
      .replace(checker, replaceChecker)
      .replace(getEffectiveCallArguments1, replaceGetEffectiveCallArguments)
      .replace(getEffectiveCallArguments2, replaceGetEffectiveCallArguments);

    writeFileSync(file, code);
  }

  writeFileSync(patch, "");
}
