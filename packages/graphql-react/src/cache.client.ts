import { parse } from "@mo36924/graphql-json";

const graphql = document.getElementById("graphql");

export const cache: { [url: string]: any } = Object.assign(Object.create(null), graphql && parse(graphql.innerHTML));
