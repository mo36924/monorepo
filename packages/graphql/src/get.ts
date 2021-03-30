import { endpoint } from "./endpoint";
import { fetch } from "./fetch";

export const get = (querystring: string) => fetch(`${endpoint}?${querystring}`);
