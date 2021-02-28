import type { Where } from "@mo36924/graphql-schema";

export type Arguments = {
  data?: any;
  where?: Where | null;
  order?: string[] | null;
  limit?: number | null;
  offset?: number | null;
};
