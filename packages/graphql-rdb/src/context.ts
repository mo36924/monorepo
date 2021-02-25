import type { Result } from "./result";

export type Context = {
  escapeId: (value: string) => string;
  escape: (value: string | number | boolean | Date | null | undefined) => string;
  db: (query: string) => Promise<Result>;
  date: Date;
  ids: { [name: string]: string[] };
};
