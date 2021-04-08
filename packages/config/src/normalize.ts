import { pathToFileURL } from "url";

export default (path: string) => {
  return pathToFileURL(path).pathname;
};
