import { FilterPattern, createFilter } from "@rollup/pluginutils";
import MagicString from "magic-string";
import type { Plugin } from "rollup";

export type Options = { include?: FilterPattern; exclude?: FilterPattern; shebang?: string; prepend?: boolean };

export default (options: Options = {}): Plugin => {
  const filter = createFilter(options.include, options.exclude);
  const prepend = !!options.prepend;
  const shebang = options.shebang || (prepend ? "#!/usr/bin/env node" : "");
  const shebangs: { [id: string]: string } = Object.create(null);

  return {
    name: "shebang",
    transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      const matches = code.match(/^#![^\n]*/);

      if (!matches) {
        return null;
      }

      const shebang = matches[0];
      shebangs[id] = shebang;
      const magicString = new MagicString(code);
      magicString.remove(0, shebang.length);
      return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) };
    },
    renderChunk(code, chunk) {
      if (!chunk.isEntry || !filter(chunk.facadeModuleId)) {
        return null;
      }

      if (prepend) {
        const magicString = new MagicString(code);
        magicString.prepend(`${shebang}\n`);
        return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) };
      }

      const _shebang = chunk.facadeModuleId && shebangs[chunk.facadeModuleId];

      if (!_shebang) {
        return null;
      }

      const magicString = new MagicString(code);
      magicString.prepend(`${shebang || _shebang}\n`);
      return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) };
    },
  };
};
