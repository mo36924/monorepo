import type { PartialConfig } from "@mo36924/config";
import "./patch";

export default async (partialConfig: PartialConfig = {}) => {
  const { default: app } = await import("./main");
  await app(partialConfig);
};
