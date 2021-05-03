import runtime from "react-refresh/runtime";
import { components } from "./components";

let timeoutId: any = null;
runtime.injectIntoGlobalHook(globalThis);

(globalThis as any).$RefreshReg$ = (type: any) => {
  if (typeof type?.url !== "string") {
    return;
  }

  let pathname: string;

  try {
    pathname = new URL(type.url).pathname;
  } catch {
    return;
  }

  components.set(pathname, type);
  runtime.register(type, pathname);

  timeoutId ??= setTimeout(() => {
    timeoutId = null;
    runtime.performReactRefresh();
  }, 30);
};

(globalThis as any).$RefreshSig$ = runtime.createSignatureFunctionForTransform;
