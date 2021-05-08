import type { PartialConfig } from "@mo36924/config";

export default async (config: PartialConfig = {}) => {
  process.env.NODE_ENV = config.watch ? "development" : "production";
  const { default: app } = await import("./app");

  try {
    await app(config);
  } catch (err) {
    process.exitCode = 1;
    console.error(String(err));
  }
};
