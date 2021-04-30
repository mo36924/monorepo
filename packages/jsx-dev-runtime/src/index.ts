import { watch } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import * as jsxDevRuntime from "react/jsx-dev-runtime";
import * as jsxRuntime from "react/jsx-runtime";

let i = 0;
const typeMap = new Map<string, any>();

const warpper = (jsx: any) => (type: any, ...args: any[]) => {
  if (typeof type !== "function" || typeof type.url !== "string") {
    return jsx(type, ...args);
  }

  const path = fileURLToPath(type.url);

  if (!path.endsWith(".tsx")) {
    return jsx(type, ...args);
  }

  if (typeMap.has(path)) {
    return jsx(typeMap.get(path), ...args);
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

  return jsx(type, ...args);
};

export const Fragment = (jsxRuntime as any).Fragment;
export const jsx = warpper((jsxRuntime as any).jsx);
export const jsxs = warpper((jsxRuntime as any).jsxs);
export const jsxDEV = warpper((jsxDevRuntime as any).jsxDEV);
