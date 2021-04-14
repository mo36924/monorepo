import { resolve } from "path";
import cosmiconfig from "./cosmiconfig";

export default (path: string) => {
  return resolve(cosmiconfig.cwd, path);
};
