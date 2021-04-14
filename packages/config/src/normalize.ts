import { pathToFileURL } from "url";
import _path from "./path";

export default (path: string) => {
  return pathToFileURL(_path(path)).pathname;
};
