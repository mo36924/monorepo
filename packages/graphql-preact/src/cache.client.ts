import { getElementById } from "@mo36924/dom-utils";
import { parse } from "@mo36924/graphql-json";
import { createObject } from "@mo36924/utils";

const graphql = getElementById("graphql");

export const cache: { [url: string]: any } = createObject(graphql && parse(graphql.innerHTML));
