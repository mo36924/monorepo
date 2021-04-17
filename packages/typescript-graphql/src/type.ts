import type { Typescript as _Typescript } from "@mo36924/typescript-patch";
import type { GraphQLSchema } from "graphql";
import type typescript from "typescript";

export type Typescript = typeof typescript;
export type TypescriptWithGraphQLSchema = _Typescript & { graphqlSchema?: GraphQLSchema };
