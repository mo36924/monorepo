export const baseType = /* GraphQL */ `
  type BaseType {
    id: UUID!
    version: Int!
    createdAt: Date!
    updatedAt: Date!
  }
`;
export const baseFieldNames = ["id", "version", "createdAt", "updatedAt"] as const;
export type BaseFieldName = typeof baseFieldNames[number];
export const isBaseFieldName = (type: string): type is BaseFieldName => baseFieldNames.includes(type as BaseFieldName);
