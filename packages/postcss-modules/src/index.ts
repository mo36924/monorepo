import { writeFile } from "@mo36924/util-node";
import { camelCase } from "change-case";
import type { Plugin, PluginCreator } from "postcss";
import selectorParser from "postcss-selector-parser";

export type Options = {
  from?: true;
  to?: string;
  extname?: string;
  loader?: string;
  format?: boolean;
  renameId?: (id: string, options: RenameOptions) => string;
  renameClass?: (className: string, options: RenameOptions) => string;
  generator?: (result: Result) => string;
  write?: (result: Result) => Promise<void> | void;
};

export type RenameOptions = {
  from: string | undefined;
  to: string | undefined;
  file: string | undefined;
  id: string | undefined;
  source: string | undefined;
};

export type Result = RenameOptions & {
  ids: { [name: string]: string };
  classes: { [name: string]: string };
  css: string;
  generator: (result: Result) => string;
  loader?: string;
  format?: boolean;
};

const defaultWrite = async (result: Result) => {
  if (!result.to) {
    return;
  }

  const cssModule = result.generator(result);
  await writeFile(result.to, cssModule, { format: result.format });
};

const defaultGenerator = (result: Result) => {
  let cssModule = "";

  if (result.loader && result.css) {
    cssModule += `import loader from ${JSON.stringify(result.loader)};\nloader(${JSON.stringify(result.css)});\n`;
  }

  for (const [id, renamedId] of Object.entries(result.ids)) {
    cssModule += `export const $${camelCase(id)} = ${JSON.stringify(renamedId)};\n`;
  }

  for (const [className, renamedClass] of Object.entries(result.classes)) {
    cssModule += `export const _${camelCase(className)} = ${JSON.stringify(renamedClass)};\n`;
  }

  cssModule = cssModule || "export {};\n";

  return cssModule;
};

const pluginCreator: PluginCreator<Options> = (options = {}): Plugin => {
  const { renameId, renameClass, write = defaultWrite, generator = defaultGenerator, loader, format } = options;
  return {
    postcssPlugin: "postcss-modules",
    OnceExit(root, { result }) {
      const ids: { [name: string]: string } = Object.create(null);
      const classes: { [name: string]: string } = Object.create(null);
      let to: string | undefined = undefined;

      if (options.to) {
        to = options.to;
      } else if (!options.from && result.opts.to) {
        to = result.opts.to + (options.extname ?? ".js");
      } else if (result.opts.from) {
        to = result.opts.from + (options.extname ?? ".js");
      }

      const renameOptions: RenameOptions = {
        from: result.opts.from,
        to,
        file: root.source?.input.file,
        id: root.source?.input.id,
        source: root.source?.input.css,
      };

      root.walkRules((rule) => {
        selectorParser((selectors) => {
          selectors.walk((selector) => {
            if (selector.type === "id") {
              if (renameId) {
                const renamedId = renameId(selector.value, renameOptions);
                ids[selector.value] = renamedId;
                selector.value = renamedId;
              } else {
                ids[selector.value] = selector.value;
              }
            } else if (selector.type === "class") {
              if (renameClass) {
                const renamedClass = renameClass(selector.value, renameOptions);
                classes[selector.value] = renamedClass;
                selector.value = renamedClass;
              } else {
                classes[selector.value] = selector.value;
              }
            }
          });
        }).processSync(rule, { updateSelector: true });
      });

      result.messages.push({ type: "export", plugin: "postcss-modules", ids, classes });
      let css: string;
      return write({
        ...renameOptions,
        ids,
        classes,
        loader,
        format,
        generator,
        get css() {
          return (css ??= root.toString());
        },
      });
    },
  };
};

pluginCreator.postcss = true;

export default pluginCreator;
