export const customScalars = /* GraphQL */ `
  scalar Date
  scalar UUID
  scalar JSON
`;
export const customScalarTypeNames = ["Date", "UUID", "JSON"] as const;
export type CustomScalarTypeName = typeof customScalarTypeNames[number];
export const isCustomScalarTypeName = (type: string): type is CustomScalarTypeName =>
  customScalarTypeNames.includes(type as CustomScalarTypeName);
