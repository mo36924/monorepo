export const comparisonOperators = ["eq", "ne", "gt", "lt", "ge", "le", "in", "like"] as const;
export const logicalOperators = ["not", "and", "or"] as const;
export type ComparisonOperator = typeof comparisonOperators[number];
export type LogicalOperator = typeof logicalOperators[number];
