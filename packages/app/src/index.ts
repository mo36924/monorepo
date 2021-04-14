import type { PartialConfig } from "@mo36924/config";
import { patch } from "@mo36924/typescript-patch";

export default async (partialConfig: PartialConfig = {}) => {
  await patch();
  const app = await import("./app");
  await app.default(partialConfig);
};
