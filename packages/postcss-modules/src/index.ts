import { writeFile } from "@mo36924/util-node";
import { camelCase } from "change-case";
import type { Plugin, PluginCreator } from "postcss";
import selectorParser from "postcss-selector-parser";

export type Options = {
  renameId?: (id: string, options: RenameOptions) => string;
  renameClass?: (className: string, options: RenameOptions) => string;
  write?: boolean | ((result: Result) => Promise<void> | void);
  extname?: string;
  path?: boolean | string;
};

export type RenameOptions = {
  from: string | undefined;
  to: string | undefined;
  file: string | undefined;
  id: string | undefined;
  source: string | undefined;
  extname: string | undefined;
  path: boolean | string | undefined;
};

export type Result = RenameOptions & {
  ids: { [name: string]: string };
  classes: { [name: string]: string };
};

const defaultWrite = async (result: Result) => {
  let path: string | undefined;

  if (result.path === true) {
    path = result.to ?? result.from;
  } else if (result.path) {
    path = result.path;
  } else {
    path = result.from;
  }

  if (!path) {
    return;
  }

  path += result.extname ?? ".js";

  const code =
    "export {};\n" +
    Object.entries(result.ids)
      .map(([id, renamedId]) => `export const $${camelCase(id)} = ${JSON.stringify(renamedId)};\n`)
      .join("") +
    Object.entries(result.classes)
      .map(
        ([className, renamedClassName]) =>
          `export const _${camelCase(className)} = ${JSON.stringify(renamedClassName)};\n`,
      )
      .join("");

  await writeFile(path, code);
};

const pluginCreator: PluginCreator<Options> = (options = {}): Plugin => {
  const { renameId, renameClass, write, extname, path } = options;
  return {
    postcssPlugin: "postcss-modules",
    OnceExit(root, { result }) {
      const ids: { [name: string]: string } = Object.create(null);
      const classes: { [name: string]: string } = Object.create(null);

      const renameOptions: RenameOptions = {
        from: result.opts.from,
        to: result.opts.to,
        file: root.source?.input.file,
        id: root.source?.input.id,
        source: root.source?.input.css,
        extname,
        path,
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

      if (write) {
        return (write === true ? defaultWrite : write)({
          ids,
          classes,
          ...renameOptions,
        });
      }
    },
  };
};

pluginCreator.postcss = true;

export default pluginCreator;
