import type { Options } from "./main";
import "./patch";

export default async (options: Options = {}) => {
  const { default: app } = await import("./main");
  await app(options);
};
