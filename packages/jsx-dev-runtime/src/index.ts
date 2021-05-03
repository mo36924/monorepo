import { components } from "@mo36924/react-refresh-runtime";
import * as jsxDevRuntime from "react/jsx-dev-runtime";
import * as jsxRuntime from "react/jsx-runtime";

const warpper = (jsx: any) => (type: any, ...args: any[]) => {
  if (typeof type === "function" && typeof type.url === "string") {
    try {
      const pathname = new URL(type.url).pathname;
      const _type = components.get(pathname);

      if (_type) {
        type = _type;
      }
    } catch {}
  }

  return jsx(type, ...args);
};

export const Fragment = (jsxRuntime as any).Fragment;
export const jsx = warpper((jsxRuntime as any).jsx);
export const jsxs = warpper((jsxRuntime as any).jsxs);
export const jsxDEV = warpper((jsxDevRuntime as any).jsxDEV);
