export const primaryKeyTypeName = "UUID";
export const customScalarTypeNames = ["UUID", "Date"];
export const scalarTypeNames = ["ID", "Int", "Float", "String", "Boolean", ...customScalarTypeNames];
export const customScalars = `
${customScalarTypeNames.map((name) => `scalar ${name}`).join("\n")}
`;
export const isScalarTypeName = (type: string) => scalarTypeNames.includes(type);
