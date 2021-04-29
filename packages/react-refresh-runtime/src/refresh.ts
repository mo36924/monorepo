import runtime from "react-refresh/runtime";

let timeoutId: any = null;

export const pathnames = new Set<string>();
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

  pathnames.add(pathname);
  runtime.register(type, pathname);

  timeoutId ??= setTimeout(() => {
    timeoutId = null;
    runtime.performReactRefresh();
  }, 30);
};

(globalThis as any).$RefreshSig$ = runtime.createSignatureFunctionForTransform;
