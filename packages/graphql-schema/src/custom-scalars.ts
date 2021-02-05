import { customScalarTypeNames } from "./utils";

export const customScalars = `
${customScalarTypeNames.map((name) => `scalar ${name}`).join("\n")}
`;
