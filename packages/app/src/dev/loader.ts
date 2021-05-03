import { parentPort } from "worker_threads";

type Resolve = (
  specifier: string,
  context: { parentURL?: string; conditions: string[] },
  defaultResolve: Resolve,
) => Promise<{ url: string }>;
type GetFormat = (url: string, context: { format: string }, defaultGetSource: GetFormat) => Promise<{ format: string }>;
type GetSource = (url: string, context: { format: string }, defaultGetSource: GetSource) => Promise<{ source: string }>;

let i = 0;
const messages: { [url: string]: (data: string) => void } = Object.create(null);

parentPort?.on("message", (value: string | [string, string]) => {
  if (typeof value === "string") {
    return;
  }

  const [url, data] = value;
  messages[url](data);
  delete messages[url];
});

const getFileSource = (url: string) =>
  new Promise<string>((resolve) => {
    url = new URL(`?${i++}`, url).href;
    messages[url] = resolve;
    parentPort!.postMessage(url);
  });

export const url = import.meta.url;

export const resolve: Resolve = async (specifier, context, defaultResolve) => {
  if (
    !context.parentURL?.includes("@mo36924/jsx-dev-runtime") &&
    (specifier === "react/jsx-dev-runtime" ||
      specifier === "react/jsx-dev-runtime.js" ||
      specifier === "react/jsx-runtime" ||
      specifier === "react/jsx-runtime.js")
  ) {
    return defaultResolve("@mo36924/jsx-dev-runtime", context, defaultResolve);
  }

  return defaultResolve(specifier, context, defaultResolve);
};

export const getFormat: GetFormat = async (url, context, defaultGetFormat) => {
  if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
    return { format: "module" };
  }

  return defaultGetFormat(url, context, defaultGetFormat);
};

export const getSource: GetSource = async (url, context, defaultGetSource) => {
  if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
    return { source: await getFileSource(url) };
  }

  return defaultGetSource(url, context, defaultGetSource);
};