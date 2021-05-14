import { readFile } from "fs/promises";
import { extname, relative } from "path";
import type { Plugin } from "rollup";
import hash from "../hash";

const cwd = process.cwd();

export default (): Plugin => {
  return {
    name: "pathname",
    async load(id) {
      if (id.endsWith(".css")) {
        const data = await readFile(id);
        const name = hash(Buffer.concat([Buffer.from(relative(cwd, id)), data]));
        const ext = extname(id);
        const pathname = `/${name}${ext}`;
        return `export default ${JSON.stringify(pathname)};`;
      }
    },
  };
};
