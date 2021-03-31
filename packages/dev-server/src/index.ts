import { isMainThread, parentPort } from "worker_threads";
import type { Options } from "./type";

type Resolve = (
  specifier: string,
  context: { parentURL?: string; conditions: string[] },
  defaultResolve: Resolve,
) => Promise<{ url: string }>;
type GetFormat = (url: string, context: { format: string }, defaultGetSource: GetFormat) => Promise<{ format: string }>;
type GetSource = (url: string, context: { format: string }, defaultGetSource: GetSource) => Promise<{ source: string }>;

let _default: (options?: Options) => Promise<void>;
let resolve: Resolve;
let getFormat: GetFormat;
let getSource: GetSource;

_default = resolve = getFormat = getSource = async () => {
  throw new Error(`Not support ${isMainThread ? "main" : "worker"} thread`);
};

if (isMainThread) {
  _default = async (options: Options = {}) => {
    const { default: mainThread } = await import("./main-thread");
    await mainThread(options);
  };
} else {
  let i = 0;
  const messages: { [url: string]: (data: string) => void } = Object.create(null);

  parentPort!.on("message", ([url, data]: [string, string]) => {
    messages[url](data);
    delete messages[url];
  });

  const getFileSource = (url: string) =>
    new Promise<string>((resolve) => {
      url = new URL(`?${i++}`, url).href;
      messages[url] = resolve;
      parentPort!.postMessage(url);
    });

  resolve = async (specifier, context, defaultResolve) => {
    return defaultResolve(specifier, context, defaultResolve);
  };

  getFormat = async (url, context, defaultGetFormat) => {
    if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
      return { format: "module" };
    }

    return defaultGetFormat(url, context, defaultGetFormat);
  };

  getSource = async (url, context, defaultGetSource) => {
    if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
      return { source: await getFileSource(url) };
    }

    return defaultGetSource(url, context, defaultGetSource);
  };
}

export type { Options };
export { _default as default, resolve, getFormat, getSource };
