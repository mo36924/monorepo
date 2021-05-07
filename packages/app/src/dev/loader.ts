import { once } from "events";
import { get, IncomingMessage } from "http";
import { workerData } from "worker_threads";

type Resolve = (
  specifier: string,
  context: { parentURL?: string; conditions: string[] },
  defaultResolve: Resolve,
) => Promise<{ url: string }>;
type GetFormat = (url: string, context: { format: string }, defaultGetSource: GetFormat) => Promise<{ format: string }>;
type GetSource = (
  url: string,
  context: { format: string },
  defaultGetSource: GetSource,
) => Promise<{ source: string | Uint8Array }>;

const devServerUrl: "http://127.0.0.1:${devServerPort}" | null | undefined = workerData?.devServerUrl;

export const url = import.meta.url;

export const resolve: Resolve = async (specifier, context, defaultResolve) => {
  if (
    devServerUrl &&
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
  if (devServerUrl && url.startsWith("file:///") && !url.includes("/node_modules/")) {
    return { format: "module" };
  }

  return defaultGetFormat(url, context, defaultGetFormat);
};

export const getSource: GetSource = async (url, context, defaultGetSource) => {
  if (devServerUrl && url.startsWith("file:///") && !url.includes("/node_modules/")) {
    const [res]: IncomingMessage[] = await once(get(devServerUrl + url.slice(7)), "response");
    const data: Buffer[] = [];

    for await (const chunk of res) {
      data.push(chunk);
    }

    const buffer = Buffer.concat(data);
    return { source: buffer };
  }

  return defaultGetSource(url, context, defaultGetSource);
};
