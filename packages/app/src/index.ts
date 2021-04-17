import type { PartialConfig } from "@mo36924/config";

export default async (partialConfig: PartialConfig = {}) => {
  const app = await import("./app");
  await app.default(partialConfig);
};
