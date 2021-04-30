import { watch } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import * as jsx from "react/jsx-dev-runtime";

let i = 0;
const typeMap = new Map<string, any>();

export const Fragment = (jsx as any).Fragment;
const _jsxDEV = (jsx as any).jsxDEV;

const jsxDEV = function (type: any, ...args: any[]) {
  if (typeof type !== "function" || typeof type.url !== "string") {
    return _jsxDEV(type, ...args);
  }

  const path = fileURLToPath(type.url);

  if (!path.endsWith(".tsx")) {
    return _jsxDEV(type, ...args);
  }

  if (typeMap.has(path)) {
    return _jsxDEV(typeMap.get(path), ...args);
  }

  typeMap.set(path, type);

  const watcher = watch(path, async (event) => {
    if (event === "rename") {
      typeMap.delete(path);
      watcher.close();
      return;
    }

    const { default: type } = await import(`${pathToFileURL(path).href}?${i++}`);

    if (typeof type === "function" && typeof type.url === "string" && path === fileURLToPath(type.url)) {
      typeMap.set(path, type);
    }
  });

  return _jsxDEV(type, ...args);
};

export { jsxDEV as jsx, jsxDEV as jsxs, jsxDEV };
