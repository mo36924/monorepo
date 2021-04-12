import type { Options } from "@mo36924/page-generator";
import cosmiconfig from "./cosmiconfig";

const page: Omit<Options, "watch"> = {
  dir: "pages",
  file: "lib/pages.ts",
  include: ["**/*.tsx"],
  exclude: ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
  ...cosmiconfig.page,
};

export default page;
