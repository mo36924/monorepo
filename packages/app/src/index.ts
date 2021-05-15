import type { PartialConfig } from "@mo36924/config";
import { handleError } from "./util";

export default async (config: PartialConfig = {}) => {
  process.env.NODE_ENV = config.watch ? "development" : "production";
  const { default: app } = await import("./app");

  try {
    await app(config);
  } catch (err) {
    handleError(err);
  }
};
