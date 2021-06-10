export const comparisonOperators = ["eq", "ne", "gt", "lt", "ge", "le", "in", "like"] as const;
export type ComparisonOperators = typeof comparisonOperators[number];
export const logicalOperators = ["not", "and", "or"] as const;
export type LogicalOperators = typeof logicalOperators[number];
