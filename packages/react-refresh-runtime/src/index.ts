import runtime from "react-refresh/runtime";

runtime.injectIntoGlobalHook(globalThis);

(globalThis as any).$RefreshReg$ = () => {};

(globalThis as any).$RefreshSig$ = () => (type: any) => type;
