import type { GraphQLSchema } from "graphql";

export type Context = { schema: GraphQLSchema; id: number; ids?: { [name: string]: string[] }; date: Date };
