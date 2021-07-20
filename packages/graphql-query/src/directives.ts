import { getDirectives as _getDirectives } from "@mo36924/graphql-schema";
import { memoize } from "@mo36924/util";

export const getDirectives = memoize(_getDirectives, new WeakMap() as any);
