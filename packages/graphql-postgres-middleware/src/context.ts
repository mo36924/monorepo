import type { Result } from "./result";

export type Context = {
  db: (query: string) => Promise<Result>;
  date: Date;
  ids: { [name: string]: string[] };
};
