import type { Config } from "@mo36924/config";
import httpServer from "./http-server";

export default async (config: Config) => {
  await httpServer(config);
};
